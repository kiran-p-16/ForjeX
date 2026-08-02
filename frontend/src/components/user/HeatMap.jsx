import React, { useEffect, useState } from "react";
import HeatMap from "@uiw/react-heat-map";
import "./heatmap.css";

const HeatMapProfile = ({ repos = [], starredRepos = [] }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Calculate real activity counts from repos & stars
    const dateCounts = {};

    // 1. Count repo creation/update dates
    repos.forEach((r) => {
      if (r.createdAt) {
        const d = new Date(r.createdAt).toISOString().split("T")[0];
        dateCounts[d] = (dateCounts[d] || 0) + 3; // +3 for repo creation
      }
      if (r.updatedAt) {
        const d = new Date(r.updatedAt).toISOString().split("T")[0];
        dateCounts[d] = (dateCounts[d] || 0) + 1; // +1 for repo edit
      }
    });

    // 2. Count star dates
    starredRepos.forEach((r) => {
      if (r.createdAt) {
        const d = new Date(r.createdAt).toISOString().split("T")[0];
        dateCounts[d] = (dateCounts[d] || 0) + 1;
      }
    });

    // Build 365-day grid
    const grid = [];
    const today = new Date();
    const start = new Date();
    start.setFullYear(today.getFullYear() - 1);
    start.setDate(start.getDate() + 1);

    const current = new Date(start);

    while (current <= today) {
      const dateStr = current.toISOString().split("T")[0];
      grid.push({
        date: dateStr,
        count: dateCounts[dateStr] || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    setData(grid);
  }, [repos, starredRepos]);

  return (
    <div className="heatmap-container">
      <h4>Contribution Activity (Last 12 Months)</h4>

      <div className="heatmap-scroll">
        <HeatMap
          value={data}
          startDate={
            new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            )
          }
          rectSize={14}
          space={4}
          weekLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
          monthLabels={[
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
          ]}
          monthLabelStyle={{
            fill: "#ffffff",
            fontSize: 12,
            fontWeight: 600,
          }}
          weekLabelStyle={{
            fill: "#ffffff",
            fontSize: 12,
            fontWeight: 500,
          }}
          legendRender={() => null}
          panelColors={{
            0: "#21262d",
            2: "#0e4429",
            5: "#006d32",
            8: "#26a641",
            10: "#39d353",
          }}
        />
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        <div className="scale">
          <i style={{ background: "#21262d" }} />
          <i style={{ background: "#0e4429" }} />
          <i style={{ background: "#006d32" }} />
          <i style={{ background: "#26a641" }} />
          <i style={{ background: "#39d353" }} />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default HeatMapProfile;
