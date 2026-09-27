import type { Flow } from './definition';
/** Legacy/template graphs have no trigger node coordinates. Reserve its first column. */
export function prepareFlowCanvas(flow:Flow):Flow{
  if(flow.triggerPosition)return flow;
  const left=flow.nodes.length?Math.min(...flow.nodes.map(n=>n.x)):580;
  const offset=Math.max(0,580-left);
  return {...flow,triggerPosition:{x:170,y:250},nodes:flow.nodes.map(n=>({...n,x:Math.min(6000,n.x+offset)}))};
}
