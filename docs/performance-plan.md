Performance improvement plan (2026-06-10)

Summary:
- Cause: frequent setData and heavy render work (FPS ~9 on index); virtual-list and lazy-image are suspects.
- Goal: raise interactive FPS to >=30 and reduce reflows by batching updates.

Hotspots (from static scan):
- components/virtual-list/* (VirtualList.js)
- components/virtual-list/virtual-list.js
- pages/index/index.js
- pages/wallet/wallet.js
- components/lazy-image/lazy-image.js
- many pages with frequent setData in scroll/touch handlers

Suggested tasks (small, reviewable):
1) VirtualList: only setData for visible slice; minimize object copying; debounce scroll handling.
2) Batch setData: collect minimal state diffs and call setData once per frame (use requestAnimationFrame).
3) Throttle scroll events and replace expensive synchronous calculations with cached values.
4) Lazy-image: use placeholders with fixed dimensions to prevent layout thrashing.
5) Instrumentation: add render timing in utils/performanceMonitor.js to log slow renders (already present, enable sampling).
6) Create PRs per component (virtual-list first).

Next actions to take (automated):
- Create branch fix/perf-20260610
- Add this plan and push
- Begin implementing VirtualList optimizations in a follow-up PR

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>