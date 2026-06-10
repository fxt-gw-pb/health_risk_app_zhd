// src/App.jsx
// AI Health Copilot —— chat-first 编排外壳。
// 风险计算全部来自冻结内核 @/kernel；本组件只负责按 screen 渲染欢迎页 / 聊天页。
import { StoreProvider, useStore } from './app/store';
import WelcomeScreen from './screens/WelcomeScreen';
import ChatScreen from './screens/ChatScreen';

function Root() {
  const { state } = useStore();
  return state.screen === 'welcome' ? <WelcomeScreen /> : <ChatScreen />;
}

export default function App() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}
