// src/screens/ChatScreen.jsx
import AppHeader from '../components/AppHeader';
import ChatThread from '../chat/ChatThread';
import Composer from '../chat/Composer';

export default function ChatScreen() {
  return (
    <div className="flex h-[100dvh] flex-col bg-[#F6F9FC]">
      <AppHeader />
      <main className="no-scrollbar flex-1 overflow-y-auto overscroll-contain">
        <ChatThread />
      </main>
      <Composer />
    </div>
  );
}
