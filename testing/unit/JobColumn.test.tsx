import { render, screen, fireEvent } from "@testing-library/react";
import { JobColumn } from "@/components/production/JobColumn";
import { ProductionJob } from "@/domain/ProductionJob";

/** jsdom has no real DataTransfer implementation, so this stands in for the one bit JobColumn actually reads: getData("text/plain"). */
function dataTransferReturning(jobId: string) {
  return { getData: () => jobId, setData: jest.fn(), dropEffect: "move" } as unknown as DataTransfer;
}

const plannedJob = new ProductionJob({
  id: "job-1",
  number: "JOB-301",
  product: "Executive Desk – Walnut",
  qty: 17,
  due: "Aug 8",
  status: "Planned",
});

describe("JobColumn — stage change via drag and drop", () => {
  it("calls onMove with the dragged job's id and this column's status when a card is dropped", () => {
    const onMove = jest.fn();
    const { container } = render(
      <JobColumn
        label="In Progress"
        status="In Progress"
        jobs={[]}
        variant="accent"
        pendingMove={null}
        onSelect={jest.fn()}
        onMove={onMove}
      />
    );

    fireEvent.drop(container.firstChild as Element, { dataTransfer: dataTransferReturning("job-1") });

    expect(onMove).toHaveBeenCalledWith("job-1", "In Progress");
  });

  it("only renders jobs whose (possibly-pending) status matches this column", () => {
    render(
      <JobColumn
        label="Planned"
        status="Planned"
        jobs={[plannedJob]}
        variant="neutral"
        pendingMove={null}
        onSelect={jest.fn()}
        onMove={jest.fn()}
      />
    );
    expect(screen.getByText("Executive Desk – Walnut")).toBeInTheDocument();
  });

  it("groups a card under its PENDING status while a move is staged but not yet saved", () => {
    // Real job is Planned, but a drag has staged it into "In Progress" — see
    // production/page.tsx's PendingMoveBanner (confirm/undo before it's saved).
    render(
      <JobColumn
        label="In Progress"
        status="In Progress"
        jobs={[plannedJob]}
        variant="accent"
        pendingMove={{ jobId: "job-1", status: "In Progress" }}
        onSelect={jest.fn()}
        onMove={jest.fn()}
      />
    );
    expect(screen.getByText("Executive Desk – Walnut")).toBeInTheDocument();
  });
});
