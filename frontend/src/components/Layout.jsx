import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Topbar />
        <main className="p-8 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
}
