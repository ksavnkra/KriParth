import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 min-h-screen">
        <Topbar />
        <main className="p-8 animate-fadeIn min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
