import { useSigma } from "react-sigma-v2";
import { FC, useEffect } from "react";
import { keyBy, omit } from "lodash";

import { Dataset, FiltersState } from "../types";

const GraphDataController: FC<{ dataset: Dataset; filters: FiltersState }> = ({ dataset, filters, children }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  /**
   * Feed graphology with the new dataset:
   */
  useEffect(() => {
    if (!graph || !dataset) return;

    const clusters = keyBy(dataset.clusters, "key");
    const tags = keyBy(dataset.tags, "key");

    dataset.nodes.forEach((node) =>
      graph.addNode(node.key, { ...node, ...omit(clusters[node.cluster], "key"), ...omit(tags[node.tag], "key") }),
    );
    dataset.edges.forEach(([source, target]) => graph.addEdge(source, target, { size: 2 }));

    // Use degrees as node sizes:
    const degrees = graph.nodes().map((node) => graph.degree(node));
    const minDegree = Math.min(...degrees);
    const maxDegree = Math.max(...degrees);
    const MIN_NODE_SIZE = 3;
    const MAX_NODE_SIZE = 30;
    graph.forEachNode((node) =>
      graph.setNodeAttribute(
        node,
        "size",
        ((graph.degree(node) - minDegree) / (maxDegree - minDegree)) * (MAX_NODE_SIZE - MIN_NODE_SIZE) + MIN_NODE_SIZE,
      ),
    );

    return () => graph.clear();
  }, [graph, dataset]);

  /**
   * Apply filters to graphology:
   */
  useEffect(() => {
    const { clusters, tags } = filters;
    graph.forEachNode((node, { cluster, tag }) =>
      graph.setNodeAttribute(node, "hidden", !clusters[cluster] || !tags[tag]),
    );
  }, [graph, filters]);

  return <>{children}</>;
};

export default GraphDataController;