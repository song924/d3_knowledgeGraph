<template>
  <div>
    <!-- canvas画图的容器 -->
    <div id="map"></div>
  </div>
</template>
   
  <script>
/* ol组件需要引入的方法和样式 */
import * as ol from "ol";
import { Map, View } from "ol";
import { Vector as VectorLayer, Tile as TileLayer } from "ol/layer";
import {
  Vector as VectorSource,
  OSM,
  XYZ,
  ImageWMS,
  OlStyleText,
} from "ol/source";
import Feature from "ol/Feature";
import "ol/ol.css";
import GeoJSON from "ol/format/GeoJSON";
import { Circle, Fill, Stroke, Style, Icon, Point, Text } from "ol/style";
import { LineString } from "ol/geom";

export default {
  data() {
    return {
      map: {}, //构建ol绘图的主体
      geojsonData: {
        //静态的小球数据文件，常规应该从接口拿取数据
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [0, 0],
            },
          },
        ],
      },
      carPoints: [], //车还要走的点
      routeIndex: 0, //当前小车所在的路段
      coordinates: [
        //线段
        [10836932.628965743, 4998172.218425438],
        [10638182.82599503, 3781582.515392581],
        [10897159.841987172, 3552719.105911153],
        [11120000.530166456, 4986126.775821152],
        [11360909.382252172, 4895785.956289009],
        [11053750.595842887, 3420219.23726401],
        [11294659.4479286, 3257605.7621061527],
        [11565681.906525029, 4823513.300663294],
        [11866817.971632171, 4757263.366339724],
        [11535568.300014313, 3185333.1064804387],
        [11812613.479912885, 3058855.959135439],
        [12125794.987624314, 4721127.038526867],
        [12402840.167522885, 4684990.710714009],
        [12023408.725487886, 2926356.090488296],
        [12300453.905386457, 2860106.1561647244],
        [12643749.0196086, 4630786.218994724],
        [12866589.707787886, 4510331.792951867],
        [12547385.478774315, 2878174.3200711533],
        [12932839.642111458, 2878174.3200711533],
        [13113521.281175744, 3751468.908881867],
        [13125566.723780029, 4739195.202433295],
        [13691702.526181456, 5425785.43087758],
        [13553179.936232172, 6112375.659321865],
        [12920794.199507171, 5407717.266971151],
        [12065567.774602886, 4974081.3332168665],
        [12788294.330860028, 4895785.956289009],
      ],
      routeLayer: {},
      pointLayer: {}, //构建第一个小球的主体
      pointLayer2: {}, //构建第二个小球的主体
    };
  },
  mounted() {
    //设置第一个小球的参数
    this.pointLayer = new VectorLayer({
      source: new VectorSource({
        //这个小球的数据的来源
        features: new GeoJSON().readFeatures(this.geojsonData), //目前是直接从data里面拿取的geojsonData数据
      }),
      style: new Style({
        //这个小球的样式
        //图片背景样式
        image: new Circle({
          radius: 12,
          color: "#ccc",
          fill: new Fill({
            color: "rgba(255, 0, 0, 1)",
          }),
          stroke: new Stroke({ color: "red", width: 1 }),
        }),
        //文字背景样式
        text: new Text({
          font: "16px sans-serif", // 设置字体
          maxAngle: 30, // 设置文字偏移量
          offsetx: 10, // 设置文字偏移量
          offsetY: 2,
          text: "1", // 文字描述
          fill: new Fill({
            // 字体颜色
            color: "#333",
          }),
          stroke: new Stroke({
            // 文字描边
            color: "#fff",
            width: 5,
          }),
        }),
      }),
    });
    //设置第二个小球的参数-同上
    this.pointLayer2 = new VectorLayer({
      source: new VectorSource({
        features: new GeoJSON().readFeatures(this.geojsonData),
      }),
      style: new Style({
        image: new Circle({
          radius: 12,
          color: "#ccc",
          fill: new Fill({
            color: "green",
          }),
          stroke: new Stroke({ color: "green", width: 1 }),
        }),
        // 设置图片下面显示字体的样式和内容
        text: new Text({
          font: "16px sans-serif", // 设置字体
          maxAngle: 30,
          offsetx: 10, // 设置文字偏移量
          offsetY: 2,
          text: "2", // 文字描述
          fill: new Fill({
            // 字体颜色
            color: "#333",
          }),
          stroke: new Stroke({
            // 文字描边
            color: "#fff",
            width: 5,
          }),
        }),
      }),
    });

    //设置绘图渲染的主体
    var layers = [
      //设置一个地图背景，注释掉的是世界地图
      new TileLayer({
        // source: new OSM(),
        // projection: "EPSG:4326", //地图数据的编码格式
      }),
      //设置一个矢量图背景
      new VectorLayer({
        source: new VectorSource({
          url: "./map.json", //GeoJSON的文件路径
          format: new GeoJSON(),
          projection: "EPSG:4326", //地图数据的编码格式
        }),
      }),
      this.pointLayer, //添加第一个小球
      this.pointLayer2, //添加第二个小球
      this.routeLayer,
      //...理论可以一直往上叠加东西
    ];

    //设置一个canvas的主体
    this.map = new Map({
      target: "map",
      view: new View({
        projection: "EPSG:4326",
        zoom: 1,
        center: [0, 0],
      }),
      layers: layers, //装载上面设置的内容
    });

    setInterval(this.translate, 500); //设置了一个定时器，让小球规律的运动

    this.open(); //自动开启功能
  },
  methods: {
    //添加矢量图层
    async open() {
      //画轨迹线
      await this.drawLine();
      //开始动
      // this.moveStart();
    },
    //小球移动数据
    translate() {
      //一号小球往左上方运动
      this.pointLayer.getSource().forEachFeature((feature) => {
        let x = 1;
        let y = 2;
        feature.getGeometry().translate(x, y);
      });
      //二号小球往右上方运动
      this.pointLayer2.getSource().forEachFeature((feature) => {
        let x = 2;
        let y = 2;
        feature.getGeometry().translate(x, y);
      });
    },
    //轨迹线  把每个点连起来
    drawLine() {},
  },
};
</script>
   
  <style>
#map {
  height: 800px;
  padding-top: 100px;
}
</style>

