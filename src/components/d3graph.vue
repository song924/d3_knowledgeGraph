<template>
  <div>
    <div id="chart" height="860" width="1200"></div>
  </div>
</template>

<script>
import * as d3 from "d3";
import install from "@/plugins/d3-context-menu";
install(d3); // 为d3注册右键菜单插件
export default {
  name: "d3graph",
  props: {
    data: {
      type: Object,
      default: function () {
        return {
          nodes: [],
          links: [],
        };
      },
    },
    /* eslint-disable */
    // 自定义图例（数组保证一一对应）
    // names		图例名称变量制作图标
    // labels		节点的标签名称（与records.json中保证相同）
    names: {
      type: Array,
    },
    labels: Array,
    linkTypes: Array,
  },
  data() {
    return {
      svgDom: null, // svg的DOM元素 => d3.select('#svg1')
      keywords: "",
      nodeState: 0,
      // 文本状态，表示是否显示文本信息（0：显示/1：不显示）
      textState: 0,
      // d3render()最终展示到页面上的数据（节点隐藏功能）
      nodes: [],
      links: [],
      /* eslint-disable */
      // 自定义图例及颜色（数组保证一一对应）
      // colors		图例颜色（9个颜色）
      // states   图例状态（on：显示 / off：不显示）
      colors: [
        "#55cccc",
        "#aaaaff",
        "#4e88af",
        "#ca635f",
        "#FFC0CB",
        "#BA55D3",
        "#1E90FF",
        "#7FFFD4",
        "#FFFF00",
      ],
      states: [],
      selectNodeData: {}, // 选中节点的详细信息展示
      isNodeClicked: false, // 是否点击（选中）节点keywords: '',
      nodeState: 0,
      // 文本状态，表示是否显示文本信息（0：显示/1：不显示）
      textState: 0,
      // d3render()最终展示到页面上的数据（节点隐藏功能）
      nodes: [],
      links: [],
      /* eslint-disable */
      // 自定义图例及颜色（数组保证一一对应）
      // colors		图例颜色（9个颜色）
      // states   图例状态（on：显示 / off：不显示）
      colors: [
        "#55cccc",
        "#aaaaff",
        "#4e88af",
        "#ca635f",
        "#FFC0CB",
        "#BA55D3",
        "#1E90FF",
        "#7FFFD4",
        "#FFFF00",
      ],
      states: [],
      selectNodeData: {}, // 选中节点的详细信息展示
      isNodeClicked: false, // 是否点击（选中）节点
      // 用于位置、大小矫正（暂不使用）
      // svgTranslate: [240, 130],
      // svgScale: 0.5,
      // 右击事件的菜单栏
      temp: {}, // 临时存储编辑时的节点信息
      dialogFormVisible: false,
      isEdit: true,
      // 节点属性对应的标签名称
      nodeObjMap: {
        address: "注册地址",
        captial: "注册资本",
        credit_code: "信用代码",
        name: "节点名称",
        setup_time: "注册日期",
      },
    };
  },
  computed: {
    isShowNode: function () {
      // `this` 指向 vm 实例
      return this.nodeState === 0;
    },
    isShowText: function () {
      // `this` 指向 vm 实例
      return this.textState === 0;
    },
    gDensity() {
      return this.nodes.length <= 1
        ? 0
        : (
            this.links.length /
            (this.nodes.length * (this.nodes.length - 1))
          ).toFixed(2);
    },
    gDegree() {
      return (this.links.length / this.nodes.length).toFixed(2);
    },
    // 企业实体的平均度数
    gMainDegree() {
      // 遍历节点
      // this.nodes.forEach(node => {
      //
      // })
      // // 遍历关系
      // this.links.forEach(link => {
      //
      // })
    },
    // 稀疏度
    gSparsity() {
      return (
        this.links.length /
        (this.nodes.length * Math.log(this.nodes.length))
      ).toFixed(2);
    },
  },
  watch: {
    // 当请求到新的数据时，重新渲染
    data(newData, oldData) {
      console.log(newData, oldData);
      // 移除svg和元素注册事件，防止内存泄漏
      this.svgDom.on(".", null);
      this.svgDom.selectAll("*").on(".", null);
      this.d3init();
    },
  },
  created() {
    // this.states = Array(this.names.length).fill('on')
  },
  mounted() {
    let browserWidth = window.innerWidth - 10;
    let browserHeight = window.innerHeight - 48;
    // console.log("browserWidth", browserWidth);
    // console.log("browserHeight", browserHeight);
    // document.getElementById("svg").style.width = browserWidth - 10 + "px";
    // document.getElementById("svg").style.height = browserHeight - 48 + "px";
    d3.select("#chart")
      .append("svg")
      .attr("id", "svg")
      .attr("width", browserWidth)
      .attr("height", browserHeight);
    this.d3init();
  },
  beforeDestroy() {
    // 移除svg和元素注册事件，防止内存泄漏
    this.svgDom.on(".", null);
    this.svgDom.selectAll("*").on(".", null);
  },
  methods: {
    // 编辑当前选中节点
    btnEdit() {
      this.temp = Object.assign({}, this.selectNodeData.properties); // copy obj
      this.dialogFormVisible = true;
      console.log(this.selectNodeData);
    },
    doEdit() {
      // console.log(this.data)
      let i = 0;
      // 更新props的data 和 selectNodeData
      this.selectNodeData.name = this.temp.name;
      this.selectNodeData.properties = this.temp;
      for (let node of this.data.nodes) {
        // console.log(node.id === this.selectNodeData.id)
        // console.log(node.id)
        // console.log(this.selectNodeData.id)
        if (node.id == this.selectNodeData.id) {
          // this.$set(this.data.nodes, i, this.selectNodeData)
          // this.$set(this.nodes, i, this.selectNodeData)
          this.data.nodes[i].properties = this.temp;
          this.nodes[i].properties = this.temp;
          break;
        }
        i++;
      }
      this.dialogFormVisible = false;
      this.d3init();
      this.$message({
        message: "更新成功",
        type: "success",
      });
    },
    cancelEdit() {
      this.dialogFormVisible = false;
    },
    // 隐藏文字
    changeTextState(state) {
      // state发生变化时才进行更新、处理
      if (this.textState !== state) {
        this.textState = state;
        // const text = d3.selectAll('.texts text')
        const text = d3.selectAll(".linkTexts text");
        console.log(text);
        // 根据新的节点状态，在节点上展示不同的文本信息
        if (this.textState === 2) {
          text.style("display", "none");
          // 暂不作校准
          // // transform属性数值化
          // // 原：translate(40, 8) scale(1)
          // // 现：[40, 8, 1]
          // let transform = d3.select('#svg1 g').attr('transform')
          // transform = transform
          //   ? transform.match(/\d.?/g).map(item => parseInt(item))
          //   : [0, 0, 1]
          // // 校准
          // transform[0] = transform[0] + this.svgTranslate[0]
          // transform[1] = transform[1] + this.svgTranslate[1]
          // transform[2] = transform[2] * this.svgScale

          // console.log(transform)
          // // 隐藏节点后，svg自动缩放
          // d3.select('#svg1 g').attr('transform', 'translate(' + transform[0] + ', ' + transform[1] + ') scale(' + transform[2] + ')')
        } else {
          text.style("display", "block");
          // 暂不作校准
          // 显示节点后，svg自动还原
          // d3.select('#svg1 g').attr('transform', '')
        }
      }
    },
    // 隐藏该类型的所有节点（图例）
    hideNodeOfType(event) {
      if (
        this.nodes.length === this.data.nodes.length ||
        this.states.some((state) => state === "off")
      ) {
        // console.log(event.target.dataset)
        const index = event.target.dataset.index;
        const state = event.target.dataset.state;
        // const nodeTypes = ['Enterprise', 'Type', 'Region', 'Country']
        // const linkTypes = ['', 'type', 'locate', 'export']
        // 图例的状态切换（对应类型的节点隐藏）
        if (state === "on") {
          // 隐藏该类型的所有节点及关联关系
          // this.states[index] = 'off'
          this.$set(this.states, index, "off");
        } else {
          // this.states[index] = 'on'
          this.$set(this.states, index, "on");
        }
        /**************************************
         * 状态更新后，同时对数据更新
         */
        const indexs = this.states.map((s) => {
          if (s === "on") {
            return "1";
          } else {
            return "0";
          }
        });
        // 遍历删除节点
        this.nodes = this.data.nodes.filter((node) => {
          for (let i = 0; i < indexs.length; i++) {
            if (node.label === this.labels[i] && indexs[i] === "0")
              return false;
          }
          return true;
        });
        // 遍历删除关系
        this.links = this.data.links.filter((link) => {
          for (let i = 0; i < indexs.length; i++) {
            if (i === 0 && indexs[i] === "0") return false;
            else if (link.type === this.linkTypes[i] && indexs[i] === "0")
              return false;
          }
          return true;
        });
        // 调试时使用
        // console.log(indexs)
        // console.log(this.data.nodes.length, this.data.links.length)
        // console.log(this.nodes.length)
        // console.log(this.links.length)
        // 重新渲染
        this.d3render();
      } else {
        this.$message.error("展示全部节点时才能隐藏图例");
      }
    },
    /*eslint-disable*/
    // 搜索包含关键字的节点
    searchKeyWords(value) {
      // 如果Input值是空的显示所有的圆和线(没有进行筛选)
      if (this.keywords === "") {
        this.clearGraphStyle();
      }
      // 否则判断判断三个元素是否等于name值，等于则显示该值
      else {
        let name = this.keywords;
        // 搜索所有的节点
        this.svgDom
          .select(".nodes")
          .selectAll("circle")
          .attr("class", (d) => {
            // 输入节点id的小写等于name则显示，否则隐藏
            if (d.properties.name.indexOf(name) >= 0) {
              return "fixed";
            } else {
              // 优化：与该搜索节点相关联的节点均显示
              // links链接的起始节点进行判断,如果其id等于name则显示这类节点
              // 注意: graph=data
              for (let i = 0; i < this.links.length; i++) {
                // 如果links的起点等于name，并且终点等于正在处理的则显示
                if (
                  this.links[i]["source"].properties.name.indexOf(name) >= 0 &&
                  this.links[i]["target"].id == d.id
                ) {
                  return "active";
                }
                // 如果links的终点等于name，并且起点等于正在处理的则显示
                if (
                  this.links[i]["target"].properties.name.indexOf(name) >= 0 &&
                  this.links[i]["source"].id == d.id
                ) {
                  return "active";
                }
              }
              return "inactive"; // 隐藏
            }
          });
        // 搜索texts
        this.svgDom
          .select(".texts")
          .selectAll("text")
          .attr("class", (d) => {
            if (d.properties.name.indexOf(name) >= 0) {
              return "";
            } else {
              // 优化：与该搜索节点相关联的节点均显示
              // links链接的起始节点进行判断,如果其id等于name则显示这类节点
              for (let i = 0; i < this.links.length; i++) {
                // 如果links的起点等于name，并且终点等于正在处理的则显示
                if (
                  this.links[i]["source"].properties.name.indexOf(name) >= 0 &&
                  this.links[i]["target"].id == d.id
                ) {
                  return "";
                }
                //如果links的终点等于name，并且起点等于正在处理的则显示
                if (
                  this.links[i]["target"].properties.name.indexOf(name) >= 0 &&
                  this.links[i]["source"].id == d.id
                ) {
                  return "";
                }
              }
              return "inactive";
            }
          });
        // 搜索links
        // 显示相的邻边 注意 ||
        this.svgDom
          .select(".links")
          .selectAll("line")
          .attr("id", (d) => {
            d.elementId;
          })
          .attr("class", (d) => {
            if (
              d.source.properties.name.indexOf(name) >= 0 ||
              d.target.properties.name.indexOf(name) >= 0
            ) {
              return "";
            } else {
              return "inactive"; //隐藏
            }
          });
        // 搜索linkTexts
        this.svgDom
          .select(".linkTexts")
          .selectAll("text")
          .attr("class", (d) => {
            if (
              d.source.properties.name.indexOf(name) >= 0 ||
              d.target.properties.name.indexOf(name) >= 0
            ) {
              return "";
            } else {
              return "inactive"; //隐藏
            }
          });
      }
    },
    // d3初始化，包括数据解析、数据渲染
    d3init() {
      this.links = this.data.links;
      this.nodes = this.data.nodes;

      this.svgDom = d3.select("#svg"); // 获取svg的DOM元素
      // this.d3jsonParser(this.graph)
      this.d3render();
      // 数据状态初始化
      this.stateInit();
    },
    // 数据状态初始化
    stateInit() {
      this.nodeState = 0;
      this.textState = 0;
      // console.log(this.names)
      this.states = Array(this.names.length).fill("on");
    },
    d3render() {
      this.nodes.map((item) => {
        item.clickFlag = false;
        item.isShow = true;
        item.isFold = false;
        this.links.map((jtem) => {
          jtem.isShow = true;
          if (jtem.startNodeElementId == item.elementId) {
            jtem.source = item;
          }

          if (jtem.endNodeElementId == item.elementId) {
            jtem.target = item;
          }
        });
      });
      console.log("this.links", this.links);
      console.log("this.nodes", this.nodes);
      let _this = this; // 临时获取Vue实例，避免与d3的this指针冲突

      // 渲染前清空svg内的元素
      _this.svgDom.selectAll("*").remove();
      // svg.selectAll('g').remove()

      let zoom = d3.zoom().on("zoom", (event) => {
        let scale = event.transform.k;
        // console.log("当前缩放倍率", scale);
        let translate = [event.transform.x, event.transform.y];
        // console.log("当前xy轴", translate);
        svg.attr(
          "transform",
          "translate(" +
            translate[0] +
            ", " +
            translate[1] +
            ") scale(" +
            scale +
            ")"
        );
      });

      let svg = _this.svgDom
        .on("click", () => {
          this.isNodeClicked = false;
          // 移除所有样式
          this.clearGraphStyle();
        })
        // 给画布绑定zoom事件（缩放、平移）
        .call(zoom)
        .append("g");

      // d3.zoomIdentity();
      this.clearGraphStyle();

      this.addMarkers();
      // console.log(svg)
      // 动态变化时，不再固定宽高
      // let width = svg.attr("width"),
      //     height = svg.attr("height")

      // 解析json和数据处理
      // 现在解析json直接在d3jsonParser()中更新nodes和links
      // const data = this.d3jsonParser(this.graph)
      // this.links = data.links.map(d => Object.create(d))
      // this.nodes = data.nodes.map(d => Object.create(d))

      // console.log("nodes", this.nodes);
      // 定义碰撞检测模型
      let forceCollide = d3
        .forceCollide()
        .radius((d) => {
          console.log(d);
          return 20 * 4.1;
        })
        .iterations(0.15)
        .strength(0.75);

      // 利用d3.forceSimulation()定义关系图 包括设置边link、排斥电荷charge、关系图中心点
      console.log("svg.node()", svg.node());

      let simulation = d3
        .forceSimulation(this.nodes)
        .force(
          "link",
          d3.forceLink().id((d) => d.id)
        )
        .force("charge", d3.forceManyBody().strength(-100))
        // .force("center", d3.forceCenter(width / 2, height / 2)
        .force(
          "center",
          d3.forceCenter(
            svg.node().parentElement.clientWidth / 2,
            svg.node().parentElement.clientHeight / 2
          )
        )
        .force("collision", forceCollide);

      //先运行一段时间让节点散开
      for (let i = 0; i < 30; i++) {
        simulation.tick();
      }

      // D3映射数据至HTML中
      // g用于绘制所有边,selectALL选中所有的line,并绑定数据data(graph.links),enter().append("line")添加元素
      // 数据驱动文档,设置边的粗细
      let link = svg
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(this.links)
        .enter()
        .append("line")
        .style("display", (d) => {
          return d.isShow ? "unset" : "none";
        })
        .attr("stroke-width", function (d) {
          // 每次访问links的一项数据
          return 2; //所有线宽度均为2
        })
        .join("path")
        .attr("marker-end", "url(#posMarker)");
      // .attr("id", (d) => d.elementId);

      let linksName = svg
        .append("g")
        .attr("class", "linkTexts")
        .selectAll("text")
        .data(this.links)
        .join("text")
        .style("text-anchor", "middle")
        .style("fill", "#fff")
        .style("font-size", "16px")
        .style("display", (d) => {
          return d.isShow ? "unset" : "none";
        })
        // .style('font-weight', 'bold')
        .text((d) => d.type)
        .attr("id", (d) => "text" + d.elementId);

      // linksName
      //   .append('textPath')
      //   .attr('xlink:href', d => '#')
      //   .attr('startOffset', '50%')

      // 添加所有的点
      // selectAll("circle")选中所有的圆并绑定数据,圆的直径为d.size
      // 再定义圆的填充色,同样数据驱动样式,圆没有描边,圆的名字为d.id
      // call()函数：拖动函数,当拖动开始绑定dragstarted函数，拖动进行和拖动结束也绑定函数
      // this.nodes.forEach((d) => (d.clickFlag = false));

      let node = svg
        .append("g")
        .attr("class", "nodes")
        .selectAll(".circleText")
        .data(this.nodes)
        .enter()
        .append("g")
        .attr("class", "singleNode")
        // .append("circle")
        .style("display", (d) => {
          return d.isShow ? "unset" : "none";
        })
        .attr("r", function (d) {
          // 每次访问nodes的一项数据
          // console.log(d)
          let size = 16;
          // console.log(_this.labels);
          switch (d.label) {
            case _this.labels[0]:
              break;
            case _this.labels[1]:
              size = 14;
              break;
            case _this.labels[2]:
              size = 13;
              break;
            default:
              size = 13;
              break;
          }
          return size * 2;
        })
        .attr("fill", (d) => {
          for (let i = 0; i < this.labels.length; i++) {
            if (d.label === this.labels[i]) return this.colors[i];
          }
        })
        .attr("stroke", "none")
        .attr("name", (d) => d.name)
        .attr("id", (d) => d.elementId)
        /* .attr("transform", function (d) {
          let cirX = d.x;
          let cirY = d.y;
          return "translate(" + cirX + "," + cirY + ")";
        }) */
        .call(this.drag(simulation))
        .on("click", function (event, d) {
          //注意：此处使用()=>箭头函数d3.select(this)无法正常取到节点，必须使用es5的写法，原因未知
          const node = d3.select(this);
          toggleCircle(node, d);
          // _this.changeGraphStyle(name);
        });
      // .on("contextmenu", d3.contextMenu(this.menu))
      /* .on("contextmenu", function (event, d) {
          // 阻止默认右键菜单的弹出
          // d3.event.preventDefault();
          nodeClick(event, d, true);
        }); */

      // 显示所有的文本
      // 设置大小、填充颜色、名字、text()设置文本
      // 使用 attr("text-anchor", "middle")设置文本居中
      let text = svg
        .append("g")
        .attr("class", "texts")
        .selectAll("text")
        .data(this.nodes)
        .enter()
        .append("g")
        .attr("font-size", () => 14)
        .attr("fill", () => "#fff")
        .attr("name", (d) => d.properties.name)
        .attr("text-anchor", "middle")
        .attr("x", function (d) {
          return textBreaking(d3.select(this), d.name);
        })
        .style("display", (d) => {
          return d.isShow ? "unset" : "none";
        })
        .call(this.drag(simulation))
        .on("click", function (event, d) {
          console.log("点击了文字");
          event.preventDefault();
          //注意：此处使用()=>箭头函数d3.select(this)无法正常取到节点，必须使用es5的写法，原因未知
          const node = d3.select(this);
          toggleCircle(node, d);
        });
      // .on("contextmenu", d3.contextMenu(this.menu))
      /* .on("contextmenu", function (event, d) {
          // 阻止默认右键菜单的弹出
          // d3.event.preventDefault();
          nodeClick(event, d, true);
        }); */

      // 圆增加title
      node.append("title").text((d) => d.name);

      //增加圆形
      node
        .append("circle")
        .attr("fill", function (d) {
          return "#d1dfc8";
        })
        .attr("r", 38)
        .attr("stroke", "none");

      // simulation中ticked数据初始化并生成图形
      simulation.on("tick", ticked);
      this.svgDom.on(
        "click",
        function () {
          // console.log("点击了画板");
          // console.log(_this.nodes);
          _this.nodes.map((d) => (d.clickFlag = false));
          // var event = d3.event;
          // var target = event.srcElement; //  获取事件发生源
          removeSingle();
        },
        true
      );

      node
        .append("text")
        .attr("y", -20)
        .attr("dy", 10)
        .attr("class", "texts")
        .attr("font-size", () => 16)
        .attr("fill", () => "#333")
        .attr("name", (d) => d.name)
        .attr("text-anchor", "middle")
        .attr("x", function (d) {
          return textBreaking(d3.select(this), d.name);
        })
        .style("display", (d) => {
          return d.isShow ? "unset" : "none";
        })
        .on("click", function (event, d) {
          console.log("点击了文字");
          event.preventDefault();
          //注意：此处使用()=>箭头函数d3.select(this)无法正常取到节点，必须使用es5的写法，原因未知
          const node = d3.select(this);
          toggleCircle(node, d);
        });
      simulation
        .force("link")
        .links(this.links)
        .distance((d) => {
          // console.log("每一边的长度", d);
          const textWidth = document.getElementById(
            `text${d.elementId}`
          ).clientWidth;
          // 每一边的长度
          let distance = textWidth + 80;
          /*  switch (d.source.label) {
            case _this.labels[0]:
              distance += 30;
              break;
            case _this.labels[1]:
              distance += 25;
              break;
            case _this.labels[2]:
              distance += 22;
              break;
            default:
              distance += 20;
              break;
          }
          switch (d.target.label) {
            case _this.labels[0]:
              distance += 30;
              break;
            case _this.labels[1]:
              distance += 25;
              break;
            case _this.labels[2]:
              distance += 22;
              break;
            default:
              distance += 20;
              break;
          } */
          return distance * 2;
        });

      /******************************************
       * 内部功能函数
       * 包括：ticked、文本分隔、节点和文本的点击事件
       */
      // ticked()函数确定link线的起始点x、y坐标 node确定中心点 文本通过translate平移变化
      function ticked() {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);
        /* .attr("x1", (d) => avoidOverlap(d.source.x, d.target.x, 20))
          .attr("y1", (d) => avoidOverlap(d.source.y, d.target.y, 20))
          .attr("x2", (d) => avoidOverlap(d.target.x, d.source.x, 20))
          .attr("y2", (d) => avoidOverlap(d.target.y, d.source.y, 20)); */

        linksName.attr("transform", (d) => {
          let x =
            Math.min(d.source.x, d.target.x) +
            Math.abs(d.source.x - d.target.x) / 2 +
            10;
          let y =
            Math.min(d.source.y, d.target.y) +
            Math.abs(d.source.y - d.target.y) / 2 -
            1;

          let tanA =
            Math.abs(d.source.y - d.target.y) /
            Math.abs(d.source.x - d.target.x);
          let angle = (Math.atan(tanA) / Math.PI) * 180;
          // let angle = Math.atan2(1,1)/Math.PI*180
          // console.log(angle)
          // 第一、二象限额外处理
          if (d.source.x > d.target.x) {
            // 第二象限
            if (d.source.y <= d.target.y) {
              angle = -angle;
            }
            // else {  // 第三象限
            //   angle = angle
            // }
          } else if (d.source.y > d.target.y) {
            // 第一象限
            angle = -angle;
          }
          return "translate(" + x + "," + y + ")" + "rotate(" + angle + ")";
        });
        node.attr("transform", function (d) {
          return "translate(" + d.x + "," + d.y + ")";
        });
      }

      // 避免节点之间连线相交的函数
      /* function avoidOverlap(a, b, padding) {
        if (a < b) {
          return a + padding;
        } else {
          return b + padding;
        }
      } */

      /**
       * 文本分隔（根据字数在当前选择器中分隔三行，超过10字省略）
       * @method textBreaking
       * @param {d3text} 文本对应的DOM对象
       * @param {text} 节点名称的文本值
       * @return {void}
       */
      function textBreaking(d3text, text) {
        const len = text.length;
        if (len <= 3) {
          d3text.append("tspan").attr("x", 0).attr("y", -5).text(text);
        } else {
          const topText = text.substring(0, 3);
          const midText = text.substring(3, 7);
          let botText = text.substring(7, len);
          let topY = -24;
          let midY = 4;
          let botY = 22;
          if (len <= 7) {
            topY += 10;
            midY += 10;
          } else if (len > 10) {
            botText = text.substring(7, 9) + "...";
          }

          d3text.text("");
          d3text
            .append("tspan")
            .attr("x", 0)
            .attr("y", topY)
            .text(function () {
              return topText;
            });
          d3text
            .append("tspan")
            .attr("x", 0)
            .attr("y", midY)
            .text(function () {
              return midText;
            });
          d3text
            .append("tspan")
            .attr("x", 0)
            .attr("y", botY)
            .text(function () {
              return botText;
            });
        }
      }

      // 分别定义节点和文本的点击事件
      // 优化：由于点击前必定触发mouseenter事件，所以不用再去查找节点id
      //      直接根据this.selectNodeData拿到节点信息
      // 优化后：只需定义一个点击事件即可
      // console.log(this.links);
      // let links = this.links;
      // let nodes = this.nodes;
      function nodeClick(d, flag) {
        console.log(d);
        console.log(d.elementId);
        let nodeIds = [];
        let linkIds = [];
        // d.isFold = !d.isFold;
        callNode(d, nodeIds, linkIds);

        linkIds = [...new Set(linkIds)];
        console.log("最终需要隐藏的节点", nodeIds);
        console.log("最终需要隐藏的线", linkIds);

        //循环匹配需要隐藏的节点并且赋值字段
        _this.nodes.map((n) => {
          nodeIds.map((item) => {
            if (item === n.elementId) {
              n.isShow = flag;
            }
          });
        });

        //循环匹配需要隐藏的线条并且赋值字段
        _this.links.map((l) => {
          if (!l.source.isShow || !l.target.isShow) {
            l.isShow = false;
          } else {
            l.isShow = true;
          }
        });

        link.style("display", (d) => {
          return d.isShow ? "unset" : "none";
        });
        linksName.style("display", (d) => {
          return d.isShow ? "unset" : "none";
        });
        node.style("display", (d) => {
          return d.isShow ? "unset" : "none";
        });
        text.style("display", (d) => {
          return d.isShow ? "unset" : "none";
        });
      }

      //筛选需要折叠的节点id
      function callNode(d, nodeIds, linkIds) {
        const nextNode = _this.links.filter(
          (l) => l.endNodeElementId === d.elementId
        );
        const parNode = _this.links.filter(
          (l) => l.startNodeElementId === d.elementId
        );
        console.log("被其他节点依赖的连线", nextNode);
        console.log("依赖其他节点的连线", parNode);
        /* if (nextNode.length) {
          nextNode.map((l) => {
            callNode(l, nodeIds, linkIds);
          });
        } else {
          return;
        } */

        const target = [];
        const links = [..._this.links];
        const nodes = [..._this.nodes];

        //筛选需要隐藏的线条
        links.map((l) => {
          if (l.endNodeElementId === d.elementId) {
            target.push(l);
            linkIds.push(l.elementId);
          }
        });

        console.log(target);

        //筛选需要隐藏的节点
        nodes.map((n) => {
          target.map((item) => {
            if (item.startNodeElementId === n.elementId) {
              nodeIds.push(n.elementId);
            }
          });
        });

        //筛选此节点有两条指向线的情况
        if (parNode.length) {
          parNode.map((l) => {
            linkIds.push(l.elementId);
          });
        }

        console.log("linkIds", linkIds);
        /* parNode.map((item) => {
          linkIds.push(item.elementId);
        }); */

        if (nextNode.length) {
          nextNode.map((l) => {
            console.log("进入循环");
            callNode(l.source, nodeIds, linkIds);
          });
        } else {
          return;
        }
      }

      function toggleCircle(current, d) {
        var currentD = d;
        if (d.clickFlag) {
          removeSingle();
          document.getElementById("svg").innerText = "";
        }
        d.clickFlag = true;
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
        var width = 300;
        height = 300;
        var g = current
          .append("g")
          .attr("class", "singleCircle")
          .attr("width", width)
          .attr("height", height);
        var Pie = g.append("g");

        var arc_generator = d3
          .arc()
          .innerRadius(width / 7)
          .outerRadius(width / 3.8);
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
        const labelValRadius = 170 * 0.35 - labelFontSize * 0.35; // 计算正确半径 文字位置
        const labelValRadius1 = 170 * 0.35 + labelFontSize * 0.35;

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
          .style("fill", "black")
          .style("font-weight", "bold")
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
      }

      //删除圆环节点
      function removeSingle() {
        d3.select(".singleCircle").remove();
      }

      function showNodes(curr) {
        console.log("curr", curr);
        console.log("展开");

        const datas = require("./../data/jfb.json");
        const nodes = [];
        const links = []; // 存放节点和关系
        const nodeSet = []; // 存放去重后nodes的id
        // console.log("this.nodes", this.nodes);
        // console.log("this.links", this.links);
        // return;
        datas.map((item) => {
          item._fields.map((jtem) => {
            jtem.identity = jtem.identity.low;
            if (jtem.labels) {
              if (nodeSet.indexOf(jtem.identity) == -1) {
                nodeSet.push(jtem.identity);
                for (const key in jtem.properties) {
                  jtem.name = jtem.properties[key];
                }
                this.nodes.push(jtem);
              }
            } else {
              jtem.source = item._fields[1];
              jtem.target = item._fields[2];
              _this.links.push(jtem);
            }
          });
        });
        // console.log("this.nodes.new", this.nodes);
        // console.log("this.links.new", this.links);

        // console.log(_this.nodes, _this.links);

        // nodeClick(curr, true);
      }

      //隐藏节点
      function deleteNextNodes() {}
    },

    // 根据当前节点名称来更改图样式
    changeGraphStyle(name) {
      // console.log(this.isNodeClicked)
      // 选择#svg1 .nodes中所有的circle，再增加个class
      this.svgDom
        .select(".nodes")
        .selectAll("circle")
        .attr("class", (d) => {
          // 节点属性name是否等于name，返回fixed（激活选中样式）
          if (d.properties.name == name) {
            return "fixed";
          }

          // 当前节点返回空，否则其他节点循环判断是否被隐藏起来(CSS设置隐藏)
          else {
            // links链接的起始节点进行判断,如果其id等于name则显示这类节点
            // 注意: graph = data
            for (let i = 0; i < this.links.length; i++) {
              // 如果links的起点等于name，并且终点等于正在处理的则显示
              if (
                this.links[i]["source"].properties.name == name &&
                this.links[i]["target"].id == d.id
              ) {
                return "active";
              }
              if (
                this.links[i]["target"].properties.name == name &&
                this.links[i]["source"].id == d.id
              ) {
                return "active";
              }
            }
            return this.isNodeClicked ? "inactive" : "";
          }
        });
      // 处理相邻的文字是否隐藏
      this.svgDom
        .select(".texts")
        .selectAll("text")
        .attr("class", (d) => {
          // 节点属性name是否等于name，返回fixed（激活选中样式）
          if (d.properties.name == name) {
            return "";
          }
          // 当前节点返回空，否则其他节点循环判断是否被隐藏起来(CSS设置隐藏)
          else {
            // links链接的起始节点进行判断,如果其id等于name则显示这类节点
            // 注意: graph = data
            for (let i = 0; i < this.links.length; i++) {
              // 如果links的起点等于name，并且终点等于正在处理的则显示
              if (
                this.links[i]["source"].properties.name == name &&
                this.links[i]["target"].id == d.id
              ) {
                return "";
              }
              if (
                this.links[i]["target"].properties.name == name &&
                this.links[i]["source"].id == d.id
              ) {
                return "";
              }
            }
            return this.isNodeClicked ? "inactive" : "";
          }
        });
      // 处理相邻的边line是否隐藏 注意 ||
      this.svgDom
        .select(".links")
        .selectAll("line")
        .attr("class", (d) => {
          if (
            d.source.properties.name == name ||
            d.target.properties.name == name
          ) {
            return "active";
          } else {
            return this.isNodeClicked ? "inactive" : "";
          }
        })
        .attr("marker-end", (d) => {
          if (
            d.source.properties.name == name ||
            d.target.properties.name == name
          ) {
            return "url(#posActMarker)";
          } else {
            return "url(#posMarker)";
          }
        });
      // 处理相邻的边上文字是否隐藏 注意 ||
      this.svgDom
        .select(".linkTexts")
        .selectAll("text")
        .attr("class", (d) => {
          if (
            d.source.properties.name == name ||
            d.target.properties.name == name
          ) {
            return "active";
          } else {
            return this.isNodeClicked ? "inactive" : "";
          }
        });
    },
    clearGraphStyle() {
      // 移除所有样式
      this.svgDom.select(".nodes").selectAll("circle").attr("class", "");
      this.svgDom.select(".texts").selectAll("text").attr("class", "");
      this.svgDom
        .select(".links")
        .selectAll("line")
        .attr("class", "")
        .attr("marker-end", "url(#posMarker)");
      this.svgDom.select(".linkTexts").selectAll("text").attr("class", "");
      // d3.select(this).attr('class', '')
    },
    drag(simulation) {
      function dragsubject(event) {
        return simulation.find(event.x, event.y);
      }

      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        // console.log(event);
        // d3.select(this).style("fill", "yellow");
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        // 注释以下代码，使拖动结束后固定节点
        // event.subject.fx = null;
        // event.subject.fy = null;
      }

      return d3
        .drag()
        .subject(dragsubject)
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    },
    // 绘制关系箭头
    addMarkers() {
      // 定义箭头的标识
      let defs = this.svgDom.append("defs");
      const posMarker = defs
        .append("marker")
        .attr("id", "posMarker")
        .attr("orient", "auto")
        .attr("stroke-width", 2)
        .attr("markerUnits", "strokeWidth")
        .attr("markerUnits", "userSpaceOnUse")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 40)
        .attr("refY", 0)
        .attr("markerWidth", 12)
        .attr("markerHeight", 12)
        .append("path")
        .attr("d", "M 0 -5 L 10 0 L 0 5")
        .attr("fill", "#e0cac1")
        .attr("stroke-opacity", 0.6);
      const posActMarker = defs
        .append("marker")
        .attr("id", "posActMarker")
        .attr("orient", "auto")
        .attr("stroke-width", 2)
        .attr("markerUnits", "strokeWidth")
        .attr("markerUnits", "userSpaceOnUse")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 31)
        .attr("refY", 0)
        .attr("markerWidth", 12)
        .attr("markerHeight", 12)
        .append("path")
        .attr("d", "M 0 -5 L 10 0 L 0 5")
        .attr("fill", "#1E90FF")
        .attr("stroke-opacity", 0.6);
      // const negMarker = defs.append("marker")
      //   .attr("id","negMarker")
      //   .attr("orient","auto")
      //   .attr("stroke-width",2)
      //   .attr("markerUnits", "strokeWidth")
      //   .attr("markerUnits", "userSpaceOnUse")
      //   .attr("viewBox", "0 -5 10 10")
      //   .attr("refX", -25)
      //   .attr("refY", 0)
      //   .attr("markerWidth", 12)
      //   .attr("markerHeight", 12)
      //   .append("path")
      //   .attr("d", "M 10 -5 L 0 0 L 10 5")
      //   .attr('fill', '#999')
      //   .attr("stroke-opacity", 0.6);
    },
  },
};
</script>

<style lang="scss">
@import "@/plugins/d3-context-menu";
$opacity: 0.15; /* 显示的不透明度 */
$activeColor: #1e90ff; /* 激活的颜色 */
svg {
  margin: 20px 0px;
  // border: 1px #000 solid;
}
/*设置节点及边的样式*/
.links line {
  stroke: #e0cac1b2; // #bbb
  stroke-opacity: 1;
  &.inactive {
    /* display: none !important; */
    opacity: $opacity;
  }
  &.active {
    stroke: $activeColor;
    stroke-width: 3px;
  }
  &.hide {
    display: none !important;
  }
}
.nodes circle {
  // stroke: #000;
  // stroke-width: 1.5px;
  &.fixed {
    // fill: rgb(102, 81, 81);
    stroke: #ffc0cb; // #888;
    stroke-width: 14px;
    stroke-opacity: $opacity + 0.3;
    border: 10px #000 solid;
  }
  &.inactive {
    /* display: none !important; */
    opacity: $opacity;
  }
  &.active {
    stroke: $activeColor;
    stroke-width: 4px;
  }
  &:hover {
    cursor: pointer;
  }
  &.hide {
    display: none !important;
  }
}
.texts {
  cursor: pointer;
  text-decoration: none;
  user-select: none;
  &:hover {
    cursor: pointer;
  }
  &.inactive {
    /* display: none !important; */
    opacity: $opacity;
  }
}
.linkTexts text {
  stroke: #ecddd8b2; // #bbb
  stroke-opacity: 1;
  &.active {
    stroke: $activeColor;
  }
  &.inactive {
    /* display: none !important; */
    opacity: $opacity;
  }
}
// #positiveMarker path {
//   fill: #fff;
// }
</style>
<style lang="scss" scoped>
@media only screen and (max-width: 1125px) {
  #info,
  #mode {
    display: none !important;
  }
}
.font-sky {
  font-size: 18px;
  color: #034c6a !important;
}
#indicator {
  position: absolute;
  // left: 50px;
  // bottom: 30px;
  left: 3vw;
  bottom: 2vw;
  text-align: left;
  color: #f2f2f2;
  font-size: 14px;
  font-weight: bold;
  & > div {
    margin-bottom: 4px;
  }
  span {
    display: inline-block;
    width: 32px;
    height: 16px;
    position: relative;
    top: 2px;
    margin-right: 8px;
  }
}
/*mode选项样式*/
#mode {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  top: 200px;
  left: 40px;
  .gState span {
    display: inline-block;
    border: 1px solid #fff;
    color: #fff;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 14px;
    transition: color, background-color 0.3s;
    -o-transition: color, background-color 0.3s;
    -ms-transition: color, background-color 0.3s;
    -moz-transition: color, background-color 0.3s;
    -webkit-transition: color, background-color 0.3s;
    ~ .active,
    ~ :hover {
      background-color: #fff;
      color: #333;
      cursor: pointer;
    }
  }
  .gState span.active,
  .gState span:hover {
    background-color: #fff;
    color: #333;
    cursor: pointer;
  }
}
/*悬浮节点的info样式*/
#info {
  position: absolute;
  bottom: 40px;
  right: 30px;
  width: 270px;
  .node-card {
    border: 1px solid #9faecf;
    background-color: #00aeff6b;
    color: #fff;
    text-align: left;
    // transition: background-color;
    // transition-delay: .3s;
    // transition-timing-function: ease;
    .el-card__header {
      border-bottom: 1px solid #50596d;
    }
  }
}
</style>
