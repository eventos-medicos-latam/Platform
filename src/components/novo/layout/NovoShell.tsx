import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NovoSidebar } from './NovoSidebar';
import '../ui/tokens.css';

export function NovoShell() {
  const location = useLocation();

  return (
    <div
      className="flex min-h-screen w-full"
      style={{ background: '#080C14', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      <NovoSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 px-6 py-7 lg:px-8 lg:py-8"
            style={{ maxWidth: '100%' }}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
