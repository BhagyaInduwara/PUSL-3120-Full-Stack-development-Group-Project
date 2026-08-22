"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { JobColumn } from "@/components/production/JobColumn";
import { NewJobModal } from "@/components/production/NewJobModal";

export default function ProductionPage() {
  const [realJobs, setRealJobs] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch the live production jobs from your backend
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/production-jobs", {
          credentials: "include" 
        });
        
        if (response.ok) {
          const data = await response.json();
          setRealJobs(data.productionJobs || data);
        }
      } catch (error) {
        console.error("Error fetching production jobs:", error);
      }
    };

    loadJobs();
  }, []);

  return (
    <>
      <PageHeader
        title="Production Jobs"
        subtitle="Manage active and completed production runs."
        actions={
          <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
            Create New Job
          </Button>
        }
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10 flex gap-4">
        {/* @ts-ignore */}
        <JobColumn title="Planned" jobs={realJobs.filter(j => j.status === 'PLANNED')} />
        {/* @ts-ignore */}
        <JobColumn title="In Progress" jobs={realJobs.filter(j => j.status === 'IN_PROGRESS')} />
        {/* @ts-ignore */}
        <JobColumn title="Completed" jobs={realJobs.filter(j => j.status === 'COMPLETED')} />
      </div>

      {/* @ts-ignore */}
      <NewJobModal 
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}