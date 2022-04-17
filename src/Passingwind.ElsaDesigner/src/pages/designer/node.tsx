import { Graph } from '@antv/x6';
import { Edge } from '@antv/x6/es';

export const nodePortAttr = {
    circle: {
        r: 6,
        magnet: true,
        stroke: '#5F95FF',
        strokeWidth: 1,
        fill: '#fff',
        style: {
            visibility: 'hidden',
            transition: 'all 1s',
        },
    },
};

export const nodePorts = {
    groups: {
        top: {
            position: 'top',
            attrs: nodePortAttr,
            text: {
                text: '输入',
            },
            tooltip: '输入',
            label: {
                position: {
                    name: 'top',
                },
            },
        },
        bottom: {
            position: 'bottom',
            attrs: nodePortAttr,
            text: {
                text: '输出',
            },
            tooltip: '输出',
            label: {
                position: {
                    name: 'bottom',
                },
            },
        },
    },
    items: [
        // 入，
        { id: 'In', group: 'top' },
        // 出，0+1个
        { id: 'Done', group: 'bottom' },
    ],
};

export const flowNodes = {
    event: {
        inherit: 'circle',
        width: 60,
        height: 60,
        ports: nodePorts,
        attrs: {
            body: {
                strokeWidth: 2,
                stroke: '#5F95FF',
                fill: '#FFF',
            },
        },
    },
    activity: {
        inherit: 'rect',
        width: 100,
        height: 60,
        ports: nodePorts,
        markup: [
            {
                tagName: 'rect',
                selector: 'body',
            },
            {
                tagName: 'image',
                selector: 'img',
            },
            {
                tagName: 'text',
                selector: 'label',
            },
        ],
        attrs: {
            body: {
                rx: 6,
                ry: 6,
                stroke: '#5F95FF',
                fill: '#EFF4FF',
                strokeWidth: 1,
            },
            // img: {
            //     x: 6,
            //     y: 6,
            //     width: 16,
            //     height: 16,
            //     'xlink:href':
            //         'https://gw.alipayobjects.com/mdn/rms_43231b/afts/img/A*pwLpRr7QPGwAAAAAAAAAAAAAARQnAQ',
            // },
            label: {
                fontSize: 12,
                fill: '#262626',
            },
        },
    },
    gateway: {
        inherit: 'polygon',
        width: 60,
        height: 60,
        ports: nodePorts,
        attrs: {
            body: {
                refPoints: '0,10 10,0 20,10 10,20',
                strokeWidth: 2,
                stroke: '#5F95FF',
                fill: '#EFF4FF',
            },
            label: {
                text: '+',
                fontSize: 40,
                fill: '#5F95FF',
            },
        },
    },
};

export const registerNodeTypes = () => {
    Graph.registerNode('event', flowNodes.event, true);

    Graph.registerNode('activity', flowNodes.activity, true);

    Graph.registerNode('gateway', flowNodes.gateway, true);

    Graph.registerEdge(
        'bpmn-edge',
        {
            inherit: 'edge',
            attrs: {
                line: {
                    stroke: '#A2B1C3',
                    strokeWidth: 2,
                    targetMarker: {
                        name: 'block',
                        width: 12,
                        height: 8,
                    },
                },
            },
            zIndex: 0,
        },
        true,
    );

    Edge.define('bpmn-edge', {});

    // 默认设置
    Edge.config({
        attrs: {
            line: {
                stroke: '#A2B1C3',
                strokeWidth: 2,
                targetMarker: {
                    name: 'block',
                    width: 12,
                    height: 8,
                },
            },
        },
        zIndex: 0,
    });
};
