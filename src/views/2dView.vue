<template>
  <div>
    <webgis />
    <!-- <gSearch @getData="update" /> -->
    <!-- <Canvas :data="data" /> -->
  </div>
</template>

<script>
import gSearch from "@/components/gSearch.vue";
import Canvas from "@/components/Canvas.vue";
import webgis from "@/components/webgis.vue";
// import d3graph from "@/components/d3graph.vue";
export default {
  components: {
    gSearch,
    Canvas,
    webgis,
  },
  data() {
    return {
      // d3jsonParser()处理 json 后返回的结果
      data: {
        nodes: [],
        links: [],
      },
      names: ["企业", "贸易类型", "地区", "国家"],
      labels: ["Enterprise", "Type", "Region", "Country"],
      linkTypes: ["", "type", "locate", "export"],
    };
  },
  mounted() {
    // this.d3jsonParser(require("../data/test.json"));
    this.getData();
  },
  methods: {
    //获取数据
    getData() {
      this.axios({
        method: "GET",
        url: "",
      }).then((res) => {
        console.log(res);
        if (res.data.code == 200) {
          this.data = {
            links: res.data.data.links,
            nodes: res.data.data.nodes,
          };
          // this.renderGraph({
          //   links,
          //   nodes,
          // });
        }
      });
    },
    // 视图更新
    update(json) {
      console.log("update");
      console.log(json);
      this.d3jsonParser(require("../data/test.json"));
    },
    /*eslint-disable*/
    // 解析json数据，主要负责数据的去重、标准化
    d3jsonParser(json) {
      const nodes = [];
      const links = []; // 存放节点和关系
      const nodeSet = []; // 存放去重后nodes的id

      // 使用vue直接通过require获取本地json，不再需要使用d3.json获取数据
      // d3.json('./../data/records.json', function (error, data) {
      //   if (error) throw error
      //   graph = data
      //   console.log(graph[0].p)
      // })

      /* for (let item of json) {
        for (let segment of item.p.segments) {
          // 重新更改data格式
          if (nodeSet.indexOf(segment.start.identity) == -1) {
            nodeSet.push(segment.start.identity);
            nodes.push({
              id: segment.start.identity,
              label: segment.start.labels[0],
              properties: segment.start.properties,
            });
          }
          if (nodeSet.indexOf(segment.end.identity) == -1) {
            nodeSet.push(segment.end.identity);
            nodes.push({
              id: segment.end.identity,
              label: segment.end.labels[0],
              properties: segment.end.properties,
            });
          }
          links.push({
            source: segment.relationship.start,
            target: segment.relationship.end,
            type: segment.relationship.type,
            properties: segment.relationship.properties,
          });
        }
      } */
      const datas = require("./../data/test.json");
      datas.map((item) => {
        item._fields.map((jtem) => {
          jtem.identity = jtem.identity.low;
          if (jtem.labels) {
            if (nodeSet.indexOf(jtem.identity) == -1) {
              nodeSet.push(jtem.identity);
              for (const key in jtem.properties) {
                jtem.name = jtem.properties[key];
              }
              nodes.push(jtem);
            }
          } else {
            jtem.source = item._fields[1];
            jtem.target = item._fields[2];
            links.push(jtem);
          }
        });
      });
      console.log("nodes", nodes);
      console.log("links", links);
      // this.links = links;
      // this.nodes = nodes;
      console.log(nodeSet);
      // this.links = links
      // this.nodes = nodes
      this.data = { nodes, links };
      // return { nodes, links }
    },
  },
};
</script>

<style lang="scss" scoped>
.gContainer {
  position: relative;
  border: 2px #000 solid;
  background-color: #9dadc1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
</style>
