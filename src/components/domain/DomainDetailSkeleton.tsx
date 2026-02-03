import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";

export const DomainDetailSkeleton = () => {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 返回按钮骨架 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Skeleton className="h-10 w-20" />
        </motion.div>

        {/* Hero Section 骨架 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border rounded-2xl p-6 sm:p-8 mb-6 shadow-sm"
        >
          {/* 域名和状态 */}
          <div className="text-center mb-6">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <div className="flex items-center justify-center gap-2 mb-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="flex items-center justify-center gap-6">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>

          {/* 价格区域 */}
          <div className="text-center py-6 border-y border-border mb-6">
            <Skeleton className="h-4 w-16 mx-auto mb-2" />
            <Skeleton className="h-12 w-40 mx-auto" />
          </div>

          {/* 按钮区域 */}
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>

          {/* 分享按钮 */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex justify-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </motion.div>

        {/* 描述骨架 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border rounded-xl p-6 mb-6 shadow-sm"
        >
          <Skeleton className="h-6 w-24 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </motion.div>

        {/* 卖家信息骨架 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border rounded-xl p-6 mb-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </motion.div>

        {/* Accordion 骨架 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 mb-6"
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className="border rounded-xl bg-card shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          ))}
        </motion.div>

        {/* 相似域名骨架 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card border rounded-xl p-6 mb-6 shadow-sm"
        >
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-3 border rounded-lg">
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};
