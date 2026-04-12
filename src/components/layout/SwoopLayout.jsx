import { Suspense } from "react";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import SwoopSidebar from "./SwoopSidebar";
import SwoopHeader from "./SwoopHeader";
import Backdrop from "./Backdrop";

const LayoutContent = ({ children, footer, actionsDrawer, mobileBar }) => {
  const { isExpanded, isHovered } = useSidebar();

  return (
    <div className="h-screen lg:flex w-full overflow-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-500 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold">
        Skip to content
      </a>
      <SwoopSidebar />
      <Backdrop />
      <div
        className={`flex flex-col h-screen transition-all duration-300 ease-in-out w-full min-w-0 ${
          isExpanded || isHovered ? "lg:pl-[290px]" : "lg:pl-[90px]"
        }`}
      >
        <SwoopHeader />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 w-full md:p-6 pb-20 md:pb-24 min-w-0">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[200px] text-gray-400">
                Loading...
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
        <footer className="border-t border-gray-200 px-4 py-4 md:px-6 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          {footer}
        </footer>
      </div>
      {mobileBar}
      {actionsDrawer}
    </div>
  );
};

const SwoopLayout = ({ children, footer, actionsDrawer, mobileBar }) => {
  return (
    <SidebarProvider>
      <LayoutContent
        footer={footer}
        actionsDrawer={actionsDrawer}
        mobileBar={mobileBar}
      >
        {children}
      </LayoutContent>
    </SidebarProvider>
  );
};

export default SwoopLayout;
