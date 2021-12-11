import { ParseResult } from "papaparse";
import Papa from "papaparse";

/**
 * This example shows how to use different programs to render nodes.
 * This works in two steps:
 * 1. You must declare all the different rendering programs to sigma when you
 *    instantiate it
 * 2. You must give to each node and edge a "type" value that matches a declared
 *    program
 * The programs offered by default by sigma are in src/rendering/webgl/programs,
 * but you can add your own.
 *
 * Here in this example, some nodes are drawn with images in them using the
 * the getNodeProgramImage provided by Sigma. Some others are drawn as white
 * disc with a border, and the custom program to draw them is in this directory:
 * - "./node.border.ts" is the node program. It tells sigma what data to give to
 *   the GPU and how.
 * - "./node.border.vert.glsl" is the vertex shader. It tells the GPU how to
 *   interpret the data provided by the program to obtain a node position,
 *   mostly.
 * - "./node.border.frag.glsl" is the fragment shader. It tells for each pixel
 *   what color it should get, relatively to data given by the program and its
 *   position inside the shape. Basically, the GPU wants to draw a square, but
 *   we "carve" a disc in it.
 */

import Graph from "graphology";
import Sigma from "sigma";

import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
import NodeProgramBorder from "./node.border";

import ForceSupervisor from "graphology-layout-force/worker";

const container = document.getElementById("sigma-container") as HTMLElement;

const graph = new Graph();

const RED = "#FA4F40";
const BLUE = "#727EE0";
const GREEN = "#5DB346";

const CITY_NODE_CONF = { size: 15, label: "New-York", type: "border", image: "./city.svg", color: BLUE };

Papa.parse("./IA_nodes.csv", {
  download: true,
  header: true,
  delimiter: ",",
  complete: onNodesParseComplete,
});

function onNodesParseComplete(results: ParseResult<{ Id: string; Name: string }>) {
  const nodes = results.data;
  nodes.forEach((node) => {
    graph.addNode(node.Id, { ...CITY_NODE_CONF, label: node.Name });
  });
  Papa.parse("./IA_edges.csv", {
    download: true,
    header: true,
    delimiter: ",",
    complete: onEdgesComplete,
  });
}

function onEdgesComplete(results: ParseResult<{ Type: string; Source: number; Target: number }>) {
  const edges = results.data;

  edges.forEach((edge) => {
    const type = edge.Type.trim() === "directed" ? "arrow" : "line";
    graph.addEdge(edge.Source, edge.Target, { type, size: 5 });
  });
  main();
}

function main() {
  graph.nodes().forEach((node, i) => {
    const angle = (i * 2 * Math.PI) / graph.order;
    graph.setNodeAttribute(node, "x", 100 * Math.cos(angle));
    graph.setNodeAttribute(node, "y", 100 * Math.sin(angle));
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderer = new Sigma(graph, container, {
    // We don't have to declare edgeProgramClasses here, because we only use the default ones ("line" and "arrow")
    nodeProgramClasses: {
      image: getNodeProgramImage(),
      border: NodeProgramBorder,
    },
    renderEdgeLabels: true,
  });

  // Create the spring layout and start it
  const layout = new ForceSupervisor(graph);
  layout.start();
}
