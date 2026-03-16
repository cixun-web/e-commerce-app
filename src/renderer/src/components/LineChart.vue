<template>
  <div ref="chartRef" :style="{ width: width + 'px', height: height + 'px' }"></div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

/**
 * 计算指定键的数值范围（最小/最大）
 */
function extent(nums) {
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  return { min, max }
}

/**
 * 将日期或时间值标准化为时间戳
 */
function toTs(v) {
  if (v instanceof Date) return v.getTime()
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const d = new Date(v)
    const t = d.getTime()
    return isNaN(t) ? 0 : t
  }
  return 0
}

/**
 * 简单的日期格式化：MM-DD HH:mm
 */
function formatTs(ts) {
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}-${dd}`
}

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  xKey: {
    type: String,
    default: ''
  },
  yKey: {
    type: String,
    default: ''
  },
  width: {
    type: Number,
    default: 780
  },
  height: {
    type: Number,
    default: 360
  },
  lineColor: {
    type: String,
    default: '#409EFF'
  },
  padding: {
    type: Object,
    default: () => ({ left: 60, right: 20, top: 20, bottom: 40 })
  }
})

const width = computed(() => props.width ?? 780)
const height = computed(() => props.height ?? 360)
const lineColor = computed(() => props.lineColor ?? '#409EFF')
const padding = computed(() => props.padding ?? { left: 60, right: 20, top: 20, bottom: 40 })

const chartRef = ref(null)
let chart = null

/**
 * 生成排序后的类目标签（仅使用接口返回的数据）
 */
const labels = computed(() => {
  const rows = (props.data ?? []).slice().sort((a, b) => toTs(a[props.xKey]) - toTs(b[props.xKey]))
  return rows.map((r) => formatTs(toTs(r[props.xKey])))
})

/**
 * 提取对应的数值序列，顺序与标签一致
 */
const values = computed(() => {
  const rows = (props.data ?? []).slice().sort((a, b) => toTs(a[props.xKey]) - toTs(b[props.xKey]))
  return rows.map((r) => {
    return Number(r[props.yKey] ?? 0)
  })
})

/**
 * 构建 ECharts 配置项
 */
function buildOption() {
  const ys = values.value
  const { max } = extent(ys.length ? ys : [0])
  const top = Math.max(max, 1)
  return {
    color: [lineColor.value],
    grid: {
      left: padding.value.left,
      right: padding.value.right,
      top: padding.value.top,
      bottom: padding.value.bottom
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels.value
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: top,
      splitNumber: 4
    },
    series: [
      {
        name: '销量',
        type: 'line',
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        data: values.value,
        lineStyle: { width: 2 }
      }
    ]
  }
}

/**
 * 渲染或更新图表实例
 */
function renderChart() {
  if (!chartRef.value) return
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  chart.setOption(buildOption(), true)
}

/**
 * 处理窗口尺寸变更，自适应图表大小
 */
function handleResize() {
  if (chart) chart.resize()
}

onMounted(() => {
  renderChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})

watch(
  () => props.data,
  async () => {
    await nextTick()
    renderChart()
  },
  { deep: true }
)

watch([width, height, padding, lineColor], async () => {
  await nextTick()
  renderChart()
})
</script>

<style scoped></style>
