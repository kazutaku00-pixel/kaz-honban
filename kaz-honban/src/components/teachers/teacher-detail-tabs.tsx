"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { User, Calendar, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface TabItem {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ size?: number }>;
}

const TABS: TabItem[] = [
  { id: "about", labelKey: "detail.tabAbout", icon: User },
  { id: "schedule", labelKey: "detail.tabSchedule", icon: Calendar },
  { id: "reviews", labelKey: "detail.tabReviews", icon: Star },
];

interface TeacherDetailTabsProps {
  aboutContent: React.ReactNode;
  scheduleContent: React.ReactNode;
  reviewsContent: React.ReactNode;
  reviewCount: number;
}

export function TeacherDetailTabs({
  aboutContent,
  scheduleContent,
  reviewsContent,
  reviewCount,
}: TeacherDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("about");
  const { t } = useI18n();

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex border-b border-border mb-6 -mx-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative mx-1",
              activeTab === tab.id
                ? "text-accent"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            <tab.icon size={16} />
            {t(tab.labelKey)}
            {tab.id === "reviews" && reviewCount > 0 && (
              <span className="text-xs text-text-muted">({reviewCount})</span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "about" && aboutContent}
        {activeTab === "schedule" && scheduleContent}
        {activeTab === "reviews" && reviewsContent}
      </div>
    </div>
  );
}
