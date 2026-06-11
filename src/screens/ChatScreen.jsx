// src/screens/ChatScreen.jsx
import AppHeader from '../components/AppHeader';
import ChatThread from '../chat/ChatThread';
import Composer from '../chat/Composer';

export default function ChatScreen() {
  // fixed inset-0：把整屏锁在视口内，页面本身不滚动；
  // 只有中间 <main> 可滚动（对话记录），底部 Composer 始终固定、不会被顶走。
  return (
    <div className="fixed inset-0 flex flex-col bg-[#F6F9FC]">
      <AppHeader />
      <main className="no-scrollbar flex-1 overflow-y-auto overscroll-contain">
        <ChatThread />
      </main>
      <Composer />
    </div>
  );
}
