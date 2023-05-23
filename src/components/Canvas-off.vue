<template>
  <div class="container">
    <div class="canvas-container">
      <slot></slot>
      <i class="el-icon-download" @click="downLoadGraph"></i>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
// import { saveSvgAsPng } from "save-svg-as-png";
export default {
  name: "cvs",
  data() {
    return {
      GraphData: {}, //初始画布数据
      //用于更新画布
      nodes: [],
      links: [],
      nodeText: [],
      linksName: [],
      simulation: null,
      width: 1980,
      height: 1080,
      //用于判断是更新还是初始化
      initialized: false,
      nodeSizeList: new Map(), //类型与半径的对应关系
      nodeTextLengthList: new Map(), //类型与节点文本个数的对应关系
      scale: d3.scaleOrdinal(d3.schemeCategory10), //用于随机展示节点颜色
      //操作圆盘参数
      clickFlag: false, //用于点击节点的时候删除其他圆盘
      //用于判断节点是否留在原地
      dragendedX: null,
      dragendedY: null,

      //查询条件
      keyword: "戴明茜",
    };
  },
  created() {},
  mounted() {
    let res = {
      data: {
        data: require("../data/obj.json"),
      },
    };
    console.log(res);
    const links = res.data.data.links;
    const nodes = res.data.data.nodes;
    //关系分组
    var linkGroup = {};
    //对连接线进行统计和分组，不区分连接线的方向，只要属于同两个实体，即认为是同一组
    var linkmap = {};
    for (var i = 0; i < links.length; i++) {
      var key =
        links[i].source < links[i].target
          ? links[i].source + ":" + links[i].target
          : links[i].target + ":" + links[i].source;
      if (!linkmap.hasOwnProperty(key)) {
        linkmap[key] = 0;
      }
      linkmap[key] += 1;
      if (!linkGroup.hasOwnProperty(key)) {
        linkGroup[key] = [];
      }
      linkGroup[key].push(links[i]);
    }
    //为每一条连接线分配size属性，同时对每一组连接线进行编号
    for (var i = 0; i < links.length; i++) {
      var key =
        links[i].source < links[i].target
          ? links[i].source + ":" + links[i].target
          : links[i].target + ":" + links[i].source;
      links[i].size = linkmap[key];
      //同一组的关系进行编号
      var group = linkGroup[key];
      var keyPair = key.split(":");
      var type = "noself"; //标示该组关系是指向两个不同实体还是同一个实体
      if (keyPair[0] == keyPair[1]) {
        type = "self";
      }
      //给节点分配编号
      this.setLinkNumber(group, type);
    }
    console.log(links);

    this.GraphData = {
      nodes: nodes,
      links: links,
    };
    // console.log(this.GraphData);
    this.renderGraph(this.GraphData);
    // }
    // });
  },
  methods: {
    //数据初始化
    renderGraph(data) {
      if (this.initialized) {
        this.updategraph(data);
      } else {
        this.initGraph(data);
        this.initialized = true;
      }
    },
    //d3svg画布初始化，包括node,link,linkname等所有画布数据
    initGraph(data) {
      console.log("初始化画布...", data);
      let self = this;
      //将json转化为对象
      const links = data.links; //.map(d => Object.create(d));
      const nodes = data.nodes; //.map(d => Object.create(d));
      // console.log("nodes", nodes);
      //初始化力导向
      self.simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(links)
            .id((d) => d.id)
            .distance(function (link) {
              return 100; // 控制距离，这里假设每个节点的边的数量是相等的
            })
          // .distance(100) //连线的长度
        )
        .force(
          "charge",
          d3.forceManyBody().strength(-1000).distanceMin(10).distanceMax(800)
        )
        // .radius((d) => {
        //   console.log(d);
        //   return 20 * 4.1;
        // })
        // .iterations(0.15)
        // .strength(0.75)
        //以电荷的方式 开始的力
        //设置碰撞半径 就是两个节点最近的距离
        .force(
          "collision",
          d3
            .forceCollide((d) => {
              // console.log(d);
              return 100; //节点与节点之间的碰撞体积数值
            })
            .strength(0.5)
        )
        .force("center", d3.forceCenter(self.width / 2, self.height / 2)); //力导向图的中心位置
      //创造容器
      //const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]);
      const svg = d3
        .select(".canvas-container")
        .append("svg")
        .attr("id", "svg")
        .attr("viewBox", [0, 0, self.width, self.height * 2]);

      //设置一个背景层，对这个背景层缩放效果好
      const bg = svg.append("g");

      //为了解决因方向改变而导致的箭头位置问题设置两个箭头样式
      //思路就是双箭头，分别指向source节点和target节点，然后根据方向的不同控制不同箭头的显示
      // 定义箭头的标识
      let defs = svg.append("defs");
      const posMarker = defs
        .append("marker")
        .attr("id", "posMarker")
        .attr("orient", "auto")
        .attr("stroke-width", 2)
        .attr("markerUnits", "strokeWidth")
        .attr("markerUnits", "userSpaceOnUse")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 12)
        .attr("markerHeight", 12)
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#333")
        .attr("stroke-opacity", 0.6);
      const posActMarker = defs
        .append("marker")
        .attr("id", "posActMarker")
        .attr("orient", "auto")
        .attr("stroke-width", 2)
        .attr("markerUnits", "strokeWidth")
        .attr("markerUnits", "userSpaceOnUse")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", -15)
        .attr("refY", 0)
        .attr("markerWidth", 12)
        .attr("markerHeight", 12)
        .append("path")
        .attr("d", "M0,0L10,-5L10,5")
        .attr("fill", "#333")
        .attr("stroke-opacity", 0.6);

      svg.on(
        "click",
        function () {
          // console.log("点击了画板");
          // console.log(_this.nodes);
          self.clickFlag = false;
          // var event = d3.event;
          // var target = event.srcElement; //  获取事件发生源
          // self.GraphData.nodes.map((d) => (d.clickFlag = false));
          self.removeSingle();
        },
        true
      );

      //绑定缩放事件
      svg
        .call(
          d3
            .zoom()
            .scaleExtent([0.1, 2]) //增加缩放范围
            .on("zoom", function () {
              bg.attr("transform", d3.event.transform);
            })
        )
        .on("dblclick.zoom", () => {}); //取消双击缩放

      // console.log(marker);

      //构建连接线样式
      // self.links = bg
      //   .append("g")
      //   .selectAll("path") //用path 比line更灵活
      //   .data(links, function (d) {
      //     // console.log(d);
      //     // d.linknum = 1;
      //     if (typeof d.source === "object") {
      //       return d.source.id + "_" + d.name + "_" + d.target.id;
      //     } else {
      //       return d.source + "_" + d.name + "_" + d.target;
      //     }
      //   })
      //   .join("path")
      //   .attr("class", "link")
      //   .attr("id", function (d) {
      //     if (typeof d.source === "object") {
      //       return d.source.id + "_" + d.name + "_" + d.target.id;
      //     } else {
      //       return d.source + "_" + d.name + "_" + d.target;
      //     }
      //   }); //作为连线的id,让连线上的文字可以找到相应连线

      self.links = bg
        .append("g")
        .selectAll("g") //用path 比line更灵活
        .data(links)
        .join("g");

      //增加节点文字描述
      self.links
        .append("path")
        // .data(links, function (d) {
        //   if (typeof d.source === "object") {
        //     return d.source.id + "_" + d.name + "_" + d.target.id;
        //   } else {
        //     return d.source + "_" + d.name + "_" + d.target;
        //   }
        // })
        // .join("path")
        .attr("class", "link")
        .attr("id", function (d) {
          if (typeof d.source === "object") {
            return d.source.id + "_" + d.name + "_" + d.target.id;
          } else {
            return d.source + "_" + d.name + "_" + d.target;
          }
        }); //作为连线的id,让连线上的文字可以找到相应连线

      self.links
        .append("text")
        .style("text-anchor", "middle")
        .style("pointer-events", "none")
        .text(function (d) {
          return d.name;
        });

      //构建连接线的文本层
      self.linksName = bg
        .append("g")
        .selectAll("text")
        .data(links)
        .join("text")
        .attr("class", "linksName")
        .append("textPath")
        .style("text-anchor", "middle")
        .attr("xlink:href", function (d) {
          //因为更新后d.source会变为一个对象，所以判断是否是对象然后取对象的id作为目标链接
          if (typeof d.source === "object") {
            return "#" + d.source.id + "_" + d.name + "_" + d.target.id;
          } else {
            return "#" + d.source + "_" + d.name + "_" + d.target;
          }
        })
        .attr("startOffset", "50%") //属性名写错导致不会生效
        .text(function (d) {
          return d.name;
        });

      //构建节点样式
      self.nodes = bg
        .append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("class", "node") //设置在前面，样式就会应用于所有节点
        .on("dblclick", self.queryProp) //双击事件获得属性
        .on("click", function (d) {
          d3.event.preventDefault();
          const node = d3.select(this);
          self.queryTest(node, d);
        }) //单击事件获得信息面板的关系
        .call(self.drag(self.simulation, self.clickFlag));
      //增加节点的名字
      self.nodes.append("title").text((d) => d.name);
      //增加圆形
      self.nodes
        .append("circle")
        .join("circle")
        .attr("r", 20)
        .attr("fill", self.color());
      //增加节点文字描述
      self.nodes
        .append("text")
        .text((d) => d.name)
        .attr("y", 30)
        .attr("dy", 10)
        .attr("class", "texts")
        .attr("font-size", () => 16)
        .attr("fill", () => "#333")
        .attr("name", (d) => d.name)
        .attr("text-anchor", "middle");

      // 定义连接线的路径生成器
      const linkPath = d3
        .linkVertical()
        .x((d) => d.x)
        .y((d) => d.y);

      //将层与仿真关联起来
      self.simulation.on("tick", () => {
        //设置连接线的跟随
        //根据源节点与目标节点的相对关系设置 路径方向
        // self.links.selectAll("text").attr("transform", (d) => {
        //   return "translate(" + x + "," + y + ")" + "rotate(" + angle + ")";
        // });

        self.links
          .selectAll("path")
          .attr("d", function (d) {
            // let sourceX = d.source.x
            // let sourceY = d.source.y
            // let targetX = d.target.y
            // let targetY = d.source.y
            //如果连接线连接的是同一个实体，则对path属性进行调整，绘制的圆弧属于长圆弧，同时对终点坐标进行微调，避免因坐标一致导致弧无法绘制
            if (d.target == d.source) {
              dr = 30 / d.linknum;
              return (
                " M " +
                d.source.x +
                "," +
                d.source.y +
                " A " +
                dr +
                "," +
                dr +
                " 0 0,1 " +
                d.target.x +
                "," +
                (d.target.y + 1)
              );
            } else if (d.size % 2 != 0 && d.linknum == 1) {
              //如果两个节点之间的连接线数量为奇数条，则设置编号为1的连接线为直线，其他连接线会均分在两边
              if (d.source.x < d.target.x) {
                return (
                  " M " +
                  d.source.x +
                  " " +
                  d.source.y +
                  " L " +
                  d.target.x +
                  " " +
                  d.target.y
                );
              } else {
                return (
                  " M " +
                  d.target.x +
                  " " +
                  d.target.y +
                  " L " +
                  d.source.x +
                  " " +
                  d.source.y
                );
              }
            }
            //根据连接线编号值来动态确定该条椭圆弧线的长半轴和短半轴，当两者一致时绘制的是圆弧
            /* 注意A属性后面的参数，前两个为长半轴和短半轴，第三个默认为0，第四个表示弧度大于180度则为1，小于则为0，这在绘制连接到相同节点的连接线时用到；
            第五个参数，0表示正角，1表示负角，即用来控制弧形凹凸的方向。本文正是结合编号的正负情况来控制该条连接线的凹凸方向，从而达到连接线对称的效果 */
            var curve = 1.5;
            var homogeneous = 1.2;
            var dx = d.target.x - d.source.x,
              dy = d.target.y - d.source.y,
              dr =
                (Math.sqrt(dx * dx + dy * dy) * (d.linknum + homogeneous)) /
                (curve * homogeneous);
            //当节点编号为负数时，对弧形进行反向凹凸，达到对称效果
            if (d.linknum < 0) {
              dr =
                (Math.sqrt(dx * dx + dy * dy) *
                  (-1 * d.linknum + homogeneous)) /
                (curve * homogeneous);
              if (d.source.x < d.target.x) {
                return (
                  " M " +
                  d.source.x +
                  "," +
                  d.source.y +
                  " A " +
                  dr +
                  "," +
                  dr +
                  " 0 0,1 " +
                  d.target.x +
                  "," +
                  d.target.y
                );
              } else {
                return (
                  " M " +
                  d.target.x +
                  "," +
                  d.target.y +
                  " A " +
                  dr +
                  "," +
                  dr +
                  " 0 0,1 " +
                  d.source.x +
                  "," +
                  d.source.y
                );
              }
            }
            if (d.source.x < d.target.x) {
              return (
                " M " +
                d.source.x +
                "," +
                d.source.y +
                " A " +
                dr +
                "," +
                dr +
                " 0 0,0 " +
                d.target.x +
                "," +
                d.target.y
              );
            } else {
              return (
                " M " +
                d.target.x +
                "," +
                d.target.y +
                " A " +
                dr +
                "," +
                dr +
                " 0 0,0 " +
                d.source.x +
                "," +
                d.source.y
              );
            }
            return (
              " M " +
              d.source.x +
              "," +
              d.source.y +
              " A " +
              dr +
              "," +
              dr +
              " 0 0,0 " +
              d.target.x +
              "," +
              d.target.y
            );
          })
          //根据方向不同选择显示不同的marker
          //这是由于解决文字方向而引起的附加问题
          //对于尾端，如果是源节点指向目的节点的时候要在尾部加箭头
          // .attr("marker-end", (d) => {
          //   // console.log("marker-end", d);
          //   if (
          //     d.source.properties.name == name ||
          //     d.target.properties.name == name
          //   ) {
          //     return "url(#posActMarker)";
          //   } else {
          //     return "url(#posMarker)";
          //   }
          // })
          .attr("marker-end", function (d) {
            if (d.source.x < d.target.x) {
              return "url(#posMarker)";
            } else {
              return null;
            }
          })
          .attr("marker-start", function (d) {
            if (d.source.x > d.target.x) {
              //如果源节点比目的节点大的时候，就认为是目的节点是源节点
              return "url(#posActMarker)";
            } else {
              return null;
            }
          });

        self.nodes.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
        //这个x,y是由什么决定的 是由 text的属性决定的 svg中text标签的属性
        // self.nodeText.attr("x", (d) => d.x).attr("y", (d) => d.y + 50);
        self.nodes.attr("transform", function (d) {
          return "translate(" + d.x + "," + d.y + ")";
        });
      });

      for (let i = 0; i < 30; i++) {
        self.simulation.tick();
      }
    },
    //给出源节点和目标节点，返回目标节点的边上距离源节点最近的点的坐标
    getCoord(source, target) {
      //根据目标节点的类型，计算路径的长度，让路径指向目标节点的边，而不是圆心

      let r = 20;
      if (this.nodeSizeList.has(target.type)) {
        r = this.nodeSizeList.get(target.type);
      }
      // console.log(r);
      let scale =
        r /
        Math.sqrt(
          Math.pow(target.y - source.y, 2) + Math.pow(target.x - source.x, 2)
        );

      let targetX = target.x - scale * (target.x - source.x);
      let targetY = target.y - scale * (target.y - source.y);
      return targetX + " " + targetY;
    },
    color() {
      return (d) => this.scale(d.type);
    },
    //节点拖拽方法
    drag(simulation, clickFlag) {
      function dragstarted(d) {
        if (!d.active) simulation.alphaTarget(0.3).restart();
        //不知道为什么网页上的例子变成了这种写法 event.subject.x; 可能是版本不同，写法不i一样了
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(d) {
        d.fx = d3.event.x; //d3事件获得鼠标拖动目标的位置然后付给目标
        d.fy = d3.event.y;
      }

      function dragended(d) {
        if (!d.active) simulation.alphaTarget(0);
        // console.log(d.clickFlag);
        // console.log(d);
        // if (d.clickFlag) {
        // d.fx = dragendedX;
        // d.fy = dragendedY;
        // } else {
        // d.fx = null;
        // d.fy = null;
        // }
      }

      return d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    },
    //点击节点的方法
    queryTest(current, d) {
      console.log("单击node节点", d);
      console.log("d3.select(this)", d3.select(this));
      this.toggleCircle(current, d);
      //直接获得点击节点及其数据
      // this.$emit("clickNode", d);
    },
    //查询属性
    queryProp(d) {
      this.$emit("dbclickNode", d);
    },
    //更新画布数据，包括node,link,linkname等所有画布数据
    updategraph(data) {
      console.log("更新图谱数据...", data);
      let self = this;
      //解决重复点击线条残留问题
      const links = data.links;
      const nodes = data.nodes;

      //更新连线
      self.links = self.links
        .data(links, function (d) {
          if (typeof d.source === "object") {
            return d.source.id + "_" + d.name + "_" + d.target.id;
          } else {
            return d.source + "_" + d.name + "_" + d.target;
          }
        })
        .join("path") //设置对象
        .merge(self.links)
        .attr("class", "link")
        .attr("id", function (d) {
          //为了解决再次点击之后 source变为节点而导致的获取不到id的情况
          if (typeof d.source === "object") {
            return d.source.id + "_" + d.name + "_" + d.target.id;
          } else {
            return d.source + "_" + d.name + "_" + d.target;
          }
        });
      //更新连线上的文字
      //构建连接线的文本层
      self.linksName = self.linksName
        .data(links, function (d) {
          if (typeof d.source === "object") {
            return d.source.id + "_" + d.name + "_" + d.target.id;
          } else {
            return d.source + "_" + d.name + "_" + d.target;
          }
        })
        .join("text")
        .attr("class", "linksName")
        .append("textPath")
        .attr(
          "xlink:href",
          function (d) {
            if (typeof d.source === "object") {
              return "#" + d.source.id + "_" + d.name + "_" + d.target.id;
            } else {
              return "#" + d.source + "_" + d.name + "_" + d.target;
            }
          }
          // d => "#" + d.source + "_" + d.name + "_" + d.target
        )
        .attr("startOffset", "50%")
        .merge(self.linksName)
        .text(function (d) {
          return d.name;
        });

      //更新节点
      self.nodes = self.nodes
        .data(nodes)
        // .append("g")
        // .selectAll("g")
        .join("g")
        .merge(self.nodes)
        .attr("class", "node") //设置在前面，样式就会应用于所有节点
        .on("dblclick", self.queryProp) //双击事件获得属性
        .on("click", function (d) {
          const node = d3.select(this);
          self.queryTest(node, d);
        }) //单击事件获得信息面板的关系
        .call(self.drag(self.simulation));
      //增加节点的名字
      self.nodes
        .text("")
        .append("title")
        .text((d) => d.name);
      //增加圆形
      self.nodes
        .append("circle")
        .join("circle")
        .attr("r", function (d) {
          if (self.nodeSizeList.has(d.type)) {
            return self.nodeSizeList.get(d.type);
          }
          return 20;
        })
        .attr("fill", self.color());
      //增加节点文字描述
      self.nodes
        .append("text")
        .text((d) => d.name)
        .attr("y", 30)
        .attr("dy", 10)
        .attr("class", "texts")
        .attr("font-size", () => 16)
        .attr("fill", () => "#333")
        .attr("name", (d) => d.name)
        .attr("text-anchor", "middle");

      //更新力
      self.simulation.nodes(nodes);
      self.simulation
        .force("link")
        // .id(d => d.index)
        .links(links);
      self.simulation.alpha(1).restart();
    },
    modifyNodeSize(targetLabel, sizeLevel) {
      //更新节点的大小
      const sizesList = [5, 10, 25, 20, 40]; //存放级别对应的半径大小
      const lengthList = [0, 1, 3, 4, 7]; //存放级别对应的节点文本长度
      this.nodeSizeList.set(targetLabel, sizesList[sizeLevel]);
      this.nodeTextLengthList.set(targetLabel, lengthList[sizeLevel]);
      // console.log(this.nodeSizeList);

      this.nodes = this.nodes.attr("r", (d) => {
        if (this.nodeSizeList.has(d.type)) {
          return this.nodeSizeList.get(d.type);
        }
        return 20;
      });
      //根据节点的类型确定节点中要展示几个文字
      this.nodeText = this.nodeText.text((d) => {
        let name = d.name;
        let len = this.nodeTextLengthList.has(d.type)
          ? this.nodeTextLengthList.get(d.type)
          : 6;
        if (name.length > len) return name.slice(0, len) + "...";
        return d.name;
      });
      this.simulation.alpha(1).restart();
    },
    downLoadGraph() {
      //原下载按钮，开发测试用于点击新增节点
      const nodes = {
        id: "884812",
        name: "节点1212313123",
        properties: { name: "节点1212313123" },
        type: "节点组",
      };
      const links = {
        id: "886810",
        source: "88483",
        target: "884812",
        properties: { name: "线条" },
        name: "子节点1011111",
      };
      console.log("this.nodes", this.nodes);
      console.log("this.links", this.links);
      console.log("this.GraphData", this.GraphData);
      this.GraphData.nodes.push(nodes);
      this.GraphData.links.push(links);
      this.renderGraph(this.GraphData);
      return;
      // console.log("下载图谱")
      if (!d3.select(".canvas-container").select("svg").node()) {
        this.$message({
          showClose: true,
          message: "没有要下载的图谱",
        });
        return;
      }
      let date = new Date();
      let pictureName = "图谱_" + date.toLocaleString() + ".png";
      saveSvgAsPng(
        d3.select(".canvas-container").select("svg").node(),
        pictureName,
        {
          scale: 10,
        }
      );
    },
    //节点的圆环操作面板
    toggleCircle(current, d) {
      console.log(d);
      var currentD = d;
      if (this.clickFlag) {
        this.removeSingle();
        // document.getElementById("svg").innerText = "";
      }
      this.clickFlag = true;
      d.clickFlag = true;
      console.log("d", d);
      document.getElementById("svg").innerText = d.name;
      var data = [
        {
          population: 30,
          value: "X",
          type: "delete",
        },
        {
          population: 30,
          value: "收起",
          type: "showOn",
        },
        {
          population: 30,
          value: "展开",
          type: "showOff",
        },
      ];
      var sum = d3.sum(
        data.map(function (d) {
          return d.population;
        })
      );
      for (const key in data) {
        if (Object.hasOwnProperty.call(data, key)) {
          const element = data[key];
          element.Percentage =
            ((element.population / sum) * 100).toFixed(0) + "%";
        }
      }
      var width = 300,
        height = 300,
        margin = { left: 30, top: 30, right: 30, bottom: 30 },
        svg_width = width + margin.left + margin.right,
        svg_height = height + margin.top + margin.bottom,
        font_size = 15;
      var g = current
        .append("g")
        .attr("class", "singleCircle")
        .attr("width", width)
        .attr("height", height);
      var Pie = g.append("g");

      var arc_generator = d3
        .arc()
        .innerRadius(width / 14)
        .outerRadius(width / 6);
      var angle_data = d3.pie().value(function (d) {
        return d.population;
      });
      var pieData = angle_data(data);
      var pieAngle = pieData.map(function (p) {
        return ((p.startAngle + p.endAngle) / 2 / Math.PI) * 180;
      });

      // var color=d3.schemeCategory10;

      //生成内部圆环
      Pie.selectAll("path")
        .data(angle_data(data))
        .enter()
        .append("path")
        .attr("d", arc_generator)
        .style("fill", function (d, i) {
          if (i == 1) {
            return "#409eff";
          } else if (i == 2) {
            return "#67c23a";
          } else {
            return "#ff8e40";
          }
        })
        .style("stroke", "#fff")
        .style("cursor", "pointer")
        .attr("class", "path")
        .attr("type", function (d) {
          return d.data.type;
        })
        .on("click", function (event, d) {
          console.log("点击了圆环节点");
          event.stopPropagation();
          if (d.data.type === "delete") {
            deleteNode(currentD);
          } else if (d.data.type === "showOn") {
            nodeClick(currentD, false);
          } else {
            showNodes(currentD, true);
          }
        });
      var arc_label = d3
        .arc()
        .innerRadius(width / 4)
        .outerRadius(width / 2);

      Pie.selectAll(".arc_label")
        .data(angle_data(data))
        .enter()
        .append("path")
        .attr("d", arc_label)
        .attr("class", "arc_label")
        .style("fill", "none");
      const labelFontSize = 12;
      const labelValRadius = 100 * 0.35 - labelFontSize * 0.35; // 计算正确半径 文字位置
      const labelValRadius1 = 100 * 0.35 + labelFontSize * 0.35;

      const labelsVals = current
        .select(".singleCircle")
        .append("g")
        .classed("labelsvals", true);

      // 定义两条路径以使标签的方向正确
      labelsVals
        .append("def")
        .append("path")
        .attr("id", "label-path-1")
        .attr(
          "d",
          `m0 ${-labelValRadius} a${labelValRadius} ${labelValRadius} 0 1,1 -0.01 0`
        );
      labelsVals
        .append("def")
        .append("path")
        .attr("id", "label-path-2")
        .attr(
          "d",
          `m0 ${-labelValRadius1} a${labelValRadius1} ${labelValRadius1} 0 1,0 0.01 0`
        );

      labelsVals
        .selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .style("font-size", labelFontSize)
        .style("fill", "#fff")
        // .style("font-weight", "bold")
        .style("text-anchor", "middle")
        .style("cursor", "pointer")
        .append("textPath")
        .attr("href", function (d, i) {
          const p = pieData[i];
          const angle = pieAngle[i];
          if (angle > 90 && angle <= 270) {
            // 根据角度选择路径
            return "#label-path-2";
          } else {
            return "#label-path-1";
          }
        })
        .attr("startOffset", function (d, i) {
          const p = pieData[i];
          const angle = pieAngle[i];
          let percent = ((p.startAngle + p.endAngle) / 2 / 2 / Math.PI) * 100;
          if (angle > 90 && angle <= 270) {
            // 分别计算每条路径的正确百分比
            return 100 - percent + "%";
          }
          return percent + "%";
        })
        .text(function (d) {
          return d.value;
        })
        .on("click", function (event, d) {
          console.log("点击了圆环文字");
          event.stopPropagation();
          console.log("event", event);
          console.log("d", d);
          if (d.type === "delete") {
            deleteNode(currentD);
          } else if (d.type === "showOn") {
            nodeClick(currentD, false);
          } else {
            showNodes(currentD, true);
          }
        });
    },
    //删除圆环节点
    removeSingle() {
      console.log("触发删除节点");
      d3.selectAll(".singleCircle").remove();
      this.GraphData.nodes.map((d) => {
        //初始化所有节点的点击状态和位置
        d.clickFlag = false;
        d.fx = null;
        d.fy = null;
      });
    },
    //给links分配编号
    setLinkNumber(group, type) {
      if (group.length == 0) return;
      //对该分组内的关系按照方向进行分类，此处根据连接的实体ASCII值大小分成两部分
      var linksA = [],
        linksB = [];
      for (var i = 0; i < group.length; i++) {
        var link = group[i];
        if (link.source < link.target) {
          linksA.push(link);
        } else {
          linksB.push(link);
        }
      }
      //确定关系最大编号。为了使得连接两个实体的关系曲线呈现对称，根据关系数量奇偶性进行平分。
      //特殊情况：当关系都是连接到同一个实体时，不平分
      var maxLinkNumber = 0;
      if (type == "self") {
        maxLinkNumber = group.length;
      } else {
        maxLinkNumber =
          group.length % 2 == 0 ? group.length / 2 : (group.length + 1) / 2;
      }
      //如果两个方向的关系数量一样多，直接分别设置编号即可
      if (linksA.length == linksB.length) {
        var startLinkNumber = 1;
        for (var i = 0; i < linksA.length; i++) {
          linksA[i].linknum = startLinkNumber++;
        }
        startLinkNumber = 1;
        for (var i = 0; i < linksB.length; i++) {
          linksB[i].linknum = startLinkNumber++;
        }
      } else {
        //当两个方向的关系数量不对等时，先对数量少的那组关系从最大编号值进行逆序编号，然后在对另一组数量多的关系从编号1一直编号到最大编号，再对剩余关系进行负编号
        //如果抛开负号，可以发现，最终所有关系的编号序列一定是对称的（对称是为了保证后续绘图时曲线的弯曲程度也是对称的）
        var biggerLinks, smallerLinks;
        if (linksA.length > linksB.length) {
          biggerLinks = linksA;
          smallerLinks = linksB;
        } else {
          biggerLinks = linksB;
          smallerLinks = linksA;
        }

        var startLinkNumber = maxLinkNumber;
        for (var i = 0; i < smallerLinks.length; i++) {
          smallerLinks[i].linknum = startLinkNumber--;
        }
        var tmpNumber = startLinkNumber;

        startLinkNumber = 1;
        var p = 0;
        while (startLinkNumber <= maxLinkNumber) {
          biggerLinks[p++].linknum = startLinkNumber++;
        }
        //开始负编号
        startLinkNumber = 0 - tmpNumber;
        for (var i = p; i < biggerLinks.length; i++) {
          biggerLinks[i].linknum = startLinkNumber++;
        }
      }
    },
  },
};
</script>

<style>
.container {
  display: flex;
}

.canvas-container {
  background: #ffffff;
  border: 1px solid #ffffff;
  border-radius: 4px;
  width: 1200px;
  height: 880px;
  flex: 1 1 auto;
  position: relative;
}

.node {
  /* stroke: #cfebfe; */
  stroke-width: 1;
  cursor: pointer;
}

.node-text {
  fill: #333;
  text-anchor: middle;
  font-size: 10px;
  user-select: none;
}
.link {
  fill: none;
  stroke: #999;
  stroke-opacity: 0.6;
  /* stroke-width: 2.25; */
}
.linksName {
  text-anchor: middle;
  fill: #333;
  font-size: 9px;
  /* font-weight: bold; */
}
.el-icon-download {
  position: absolute;
  bottom: 10px;
  right: 20px;
  cursor: pointer;
  font: 3em sans-serif;
  color: rgba(192, 192, 192, 0.5);
}
</style>
