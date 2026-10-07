// FS-I3：客户端 UI 状态（zustand）
// 原则：只放「纯交互态」——计数器、待办；服务端数据（/api/time）不进 store，交给 SWR。
import { create } from 'zustand';

export interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface AppState {
  // 计数器
  count: number;
  inc: () => void;
  dec: () => void;
  resetCount: () => void;

  // 待办
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  removeTodo: (id: number) => void;
}

let nextTodoId = 3;

export const useAppStore = create<AppState>((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
  dec: () => set((s) => ({ count: s.count - 1 })),
  resetCount: () => set({ count: 0 }),

  todos: [
    { id: 1, text: '理解 SSG / ISR / SSR 渲染时机', done: true },
    { id: 2, text: '跑通 SSE 流式 AI 演示', done: false },
  ],
  addTodo: (text) =>
    set((s) => ({
      todos: [...s.todos, { id: nextTodoId++, text, done: false }],
    })),
  toggleTodo: (id) =>
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    })),
  removeTodo: (id) =>
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),
}));
