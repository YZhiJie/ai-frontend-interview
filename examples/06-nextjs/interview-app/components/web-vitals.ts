// FS-A3：Web Vitals 采集上报占位
// useReportWebVitals 只能在客户端组件中使用；此文件无 JSX，使用 .ts 即可。
// 真实项目中把 console.log 换成 fetch('/api/vitals') 或 RUM SDK 上报，
// 按路由聚合 LCP/CLS/INP/FCP/TTFB，并对 P75 超预算告警。
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // eslint-disable-next-line no-console
    console.log(
      `[web-vitals] ${metric.name} = ${metric.value.toFixed(2)} (rating: ${metric.rating}, id: ${metric.id})`,
    );
    // 占位：生产环境改为
    // fetch('/api/vitals', { method: 'POST', body: JSON.stringify(metric) });
  });

  return null;
}
