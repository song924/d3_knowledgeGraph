<template>
  <div>
    <div id="map" ref="map" style="width: 100vw; height: 100vh"></div>
  </div>
</template>
 
<script>
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import { Draw } from "ol/interaction";
import { Style, Fill, Stroke, Circle, Icon } from "ol/style";
import { transform, fromLonLat, toLonLat } from "ol/proj";
import { Point, LineString } from "ol/geom";
import GeoJSON from "ol/format/GeoJSON";
import { Map, View, interaction, events } from "ol";
import TileLayer from "ol/layer/Tile";
import { defaults as defaultControls } from "ol/control";
import XYZ from "ol/source/XYZ";

export default {
  data() {
    return {
      map: {},
      featureMove: {},
      carPoints: [], //车还要走的点
      routeIndex: 0, //当前小车所在的路段
      timer: {},
      coordinates: [
        //线路图，注释掉的是多余的线条，想要更多路径自己再设置,原理是每一个坐标第一个是x轴，第二个是y轴，想要什么样的线自己改，然后会自动连一条线到设置好的坐标
        [12955000.468998, 4841440.355787],
        [12945600.468998, 4841330.355787],
        [12945000.468998, 4841850.355787],
        [12944500.468998, 4846050.355787],
        // [11238182.841987172, 13552719.105911153],
        // [-11238182.530166456, 13552719.775821152],
        // [-11238182.382252172, 1111111.956289009],
        // [11053750.595842887, 3420219.23726401],
        // [11294659.4479286, 3257605.7621061527],
        // [11565681.906525029, 4823513.300663294],
        // [11866817.971632171, 4757263.366339724],
        // [11535568.300014313, 3185333.1064804387],
        // [11812613.479912885, 3058855.959135439],
        // [12125794.987624314, 4721127.038526867],
        // [12402840.167522885, 4684990.710714009],
        // [12023408.725487886, 2926356.090488296],
        // [12300453.905386457, 2860106.1561647244],
        // [12643749.0196086, 4630786.218994724],
        // [12866589.707787886, 4510331.792951867],
        // [12547385.478774315, 2878174.3200711533],
        // [12932839.642111458, 2878174.3200711533],
        // [13113521.281175744, 3751468.908881867],
        // [13125566.723780029, 4739195.202433295],
        // [13691702.526181456, 5425785.43087758],
        // [13553179.936232172, 6112375.659321865],
        // [12920794.199507171, 5407717.266971151],
        // [12065567.774602886, 4974081.3332168665],
        // [12788294.330860028, 4895785.956289009],
      ],
      routeLayer: {},
    };
  },
  mounted() {
    this.initMap(); //初始化地图方法
    this.open(); //自动开启功能
  },
  methods: {
    //初始化地图
    initMap() {
      this.map = new Map({
        target: "map",
        layers: [
          new TileLayer({
            source: new XYZ({
              // url: "http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}",
              url: "http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}",
            }),
          }),
          //设置一个矢量图背景
          // new VectorLayer({
          //   source: new VectorSource({
          //     url: "./map.json", //GeoJSON的文件路径
          //     format: new GeoJSON(),
          //     projection: "EPSG:4326", //地图数据的编码格式
          //   }),
          // }),
        ],
        view: new View({
          center: transform([106.5, 29.5], "EPSG:4326", "EPSG:3857"),
          zoom: 12,
          // zoom: 1,
        }),
      });
    },
    //添加矢量图层
    async open() {
      //画轨迹线
      await this.drawLine();
      //开始动
      this.moveStart();
    },
    //轨迹线  把每个点连起来
    drawLine() {
      this.routeLayer = new VectorLayer({
        source: new VectorSource({
          features: [],
        }),
      });
      this.map.addLayer(this.routeLayer);

      let comDots = [];
      let wireFeature = {};
      this.coordinates.forEach((item) => {
        comDots.push(item);
        wireFeature = new Feature({
          geometry: new LineString(comDots),
        });
        wireFeature.setStyle(
          new Style({
            stroke: new Stroke({
              // 设置边的样式
              color: "rgb(21, 106, 158)",
              width: 3,
            }),
          })
        );
        this.routeLayer.getSource().addFeatures([wireFeature]);
      });
    },
    //创建小车这个要素
    moveStart() {
      //坐标转换
      this.dotsData = this.coordinates.map((item) => {
        return transform(item, "EPSG:3857", "EPSG:4326");
      });
      //深复制车的位置，不在原数组改变，方便重新播放
      // this.carPoints = JSON.parse(JSON.stringify(this.dotsData));
      this.carPoints = [...this.dotsData];

      //小车最初位置在第一个坐标点
      this.featureMove = new Feature({
        geometry: new Point(this.carPoints[0]),
      });
      this.featureMove.setStyle(
        new Style({
          image: new Icon({
            src: "https://openlayers.org/en/v4.6.5/examples/data/icon.png",
            scale: 0.85,
            anchor: [0.5, 0.5],
            rotation: this.countRotate(),
          }),
        })
      );
      //添加车辆元素到图层
      this.routeLayer.getSource().addFeature(this.featureMove);
      this.timeStart();
    },
    //计时器开始
    timeStart() {
      this.timer = setInterval(() => {
        if (this.routeIndex + 1 >= this.carPoints.length) {
          //重头开始
          this.routeIndex = 0;
          //移除要素
          this.routeLayer.getSource().removeFeature(this.featureMove);
          clearInterval(this.timer);
          //重复运动
          this.open(); //自动开启功能
          return;
        }
        //到转折点旋转角度
        if (this.nextPoint() === this.carPoints[this.routeIndex + 1]) {
          this.routeIndex++;
          this.featureMove
            .getStyle()
            .getImage()
            .setRotation(this.countRotate());
        }
        //改变坐标点
        this.featureMove
          .getGeometry()
          .setCoordinates(fromLonLat(this.carPoints[this.routeIndex]));
      }, 10);
    },
    //计算下一个点的位置
    //这里的算法是计算了两点之间的点   两点之间的连线可能存在很多个计算出来的点
    nextPoint() {
      let routeIndex = this.routeIndex;
      let p1 = this.map.getPixelFromCoordinate(
        fromLonLat(this.carPoints[routeIndex])
      ); //获取在屏幕的像素位置
      let p2 = this.map.getPixelFromCoordinate(
        fromLonLat(this.carPoints[routeIndex + 1])
      );
      let dx = p2[0] - p1[0];
      let dy = p2[1] - p1[1];
      //打印可见  在没有走到下一个点之前，下一个点是不变的，前一个点以这个点为终点向其靠近
      let distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= 1) {
        return this.carPoints[routeIndex + 1];
      } else {
        let x = p1[0] + dx / distance;
        let y = p1[1] + dy / distance;
        let coor = transform(
          this.map.getCoordinateFromPixel([x, y]),
          "EPSG:3857",
          "EPSG:4326"
        );
        this.carPoints[routeIndex] = coor; //这里会将前一个点重新赋值  要素利用这个坐标变化进行移动
        return this.carPoints[routeIndex];
      }
    },
    //计算两点之间的角度  算旋转角度
    countRotate() {
      let i = this.routeIndex,
        j = i + 1;
      if (j === this.carPoints.length) {
        i--;
        j--;
      }
      let p1 = this.carPoints[i];
      let p2 = this.carPoints[j];
      return Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
    },
  },
};
</script>
 
<style lang="scss" scoped>
</style>