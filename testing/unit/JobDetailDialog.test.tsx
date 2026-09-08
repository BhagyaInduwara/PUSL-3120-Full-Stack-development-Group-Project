import { render, screen, fireEvent } from "@testing-library/react";
import { JobDetailDialog } from "@/components/production/JobDetailDialog";
import { ProductionJob, type JobStatus } from "@/domain/ProductionJob";

function job(status: JobStatus, progress = 0) {
  return new ProductionJob({
    id: "job-1",
    number: "JOB-301",
    product: "Executive Desk – Walnut",
    qty: 17,
    due: "Aug 8",
    status,
    progress,
  });
}

describe("JobDetailDialog — visual badge state transitions", () => {
  it.each<[JobStatus]>([["Planned"], ["In Progress"], ["Completed"]])(
    "shows a '%s' status badge and only offers Edit when the job's own status allows it",
    (status) => {
      render(<JobDetailDialog job={job(status)} onClose={jest.fn()} onSave={jest.fn()} />);

      expect(screen.getByText(status)).toBeInTheDocument();

      const editButton = screen.queryByRole("button", { name: "Edit" });
      if (status === "Completed") {
        expect(editButton).not.toBeInTheDocument();
      } else {
        expect(editButton).toBeInTheDocument();
      }
    }
  );
});

describe("JobDetailDialog — progress slider (In Progress jobs)", () => {
  it("moving the slider updates the displayed completion percentage", () => {
    render(<JobDetailDialog job={job("In Progress", 40)} onClose={jest.fn()} onSave={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const slider = screen.getByRole("slider");
    expect(slider).toHaveValue("40");
    expect(screen.getByText("Completion — 40%")).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: "75" } });

    expect(slider).toHaveValue("75");
    expect(screen.getByText("Completion — 75%")).toBeInTheDocument();
  });

  it("saves the new progress value through the Save → Confirm flow", () => {
    const onSave = jest.fn();
    render(<JobDetailDialog job={job("In Progress", 40)} onClose={jest.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByRole("slider"), { target: { value: "90" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm & save" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ progress: 90 }));
  });

  it("does not offer a progress slider for a Planned job (scope fields are editable instead)", () => {
    render(<JobDetailDialog job={job("Planned")} onClose={jest.fn()} onSave={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    // Field/Input render a <label> with no htmlFor/id association (a
    // pre-existing accessibility gap, not something this test should paper
    // over), so the reliable way to find the field is by its current value.
    expect(screen.getByDisplayValue("Executive Desk – Walnut")).toBeInTheDocument();
  });
});
