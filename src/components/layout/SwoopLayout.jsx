import { Suspense } from "react";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import SwoopSidebar from "./SwoopSidebar";
import SwoopHeader from "./SwoopHeader";
import Backdrop from "./Backdrop";

const LayoutContent = ({ children, footer, actionsDrawer, mobileBar }) => {
  const { isExpanded, isHovered } = useSidebar();

  return (
    <div className="min-h-screen lg:flex w-full">
      <SwoopSidebar />
      <Backdrop />
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out w-full ${
          isExpanded || isHovered ? "lg:pl-[290px]" : "lg:pl-[90px]"
        }`}
      >
        <SwoopHeader />
        <main className="flex-1 p-4 w-full md:p-6 pb-20 md:pb-24">
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
