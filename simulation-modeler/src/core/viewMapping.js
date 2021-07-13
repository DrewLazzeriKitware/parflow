import _ from "lodash";

const tabs = [
  { simputLabel: "Core", displayLabel: "Grid", showAll: true },
  {
    simputLabel: "Solver",
    displayLabel: "Forcing",
    // shownInputs: [
    //   "Solver.Solver/CLM/MetFileNT",
    //   "Solver.Solver/CLM/MetFileName",
    //   "Solver.Solver/CLM/MetFilePath"
    // ],
    showAll: true
  },
  {
    simputLabel: "Geom Properties",
    displayLabel: "Soil Properties",
    showAll: true
  }
];

export default _.keyBy(tabs, "simputLabel");
