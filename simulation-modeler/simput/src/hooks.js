// import EnumDomainUpdate from "./EnumDomainUpdate.js";
// import VariableTableUpdate from "./VariableTableUpdate.js";

module.exports = function initialize(Simput) {
  Simput.registerHook("ReadNamesWriteTableHook", function(
    hookConfig,
    dataModel,
    currentViewData,
    modelDefinition
  ) {
    // When dynamic tokens are updated, update all their children
    const update = new VariableTableUpdate({
      hookConfig,
      dataModel,
      currentViewData,
      modelDefinition
    });
    update.run();
  });
  Simput.registerHook("ReadLocationsWriteDomainHook", function(
    hookConfig,
    dataModel,
    currentViewData,
    modelDefinition
  ) {
    const update = new EnumDomainUpdate({
      hookConfig,
      dataModel,
      currentViewData,
      modelDefinition
    });
    update.run();
  });
};

class EnumDomainUpdate {
  constructor(hookParams) {
    const {
      hookConfig,
      dataModel,
      modelDefinition,
      currentViewData
    } = hookParams;
    const { source_id, dependant_domains } = hookConfig;

    Object.assign(this, {
      modelDefinition,
      dataModel,
      source_id,
      currentViewData,
      dependant_domains
    });
  }

  run() {
    for (const a in this.currentViewData) {
      const attr = this.currentViewData[a];
      for (const p in attr) {
        if (p === this.source_id) {
          const param = attr[p];
          const found = this.findNewDomain(param);
          if (found) {
            this.copySourceToDomains();
          }
        }
      }
    }
  }

  findNewDomain(param) {
    if (param.value[0]) {
      const source = param.value[0].split(" ");
      this.newDomain = source.reduce(
        (acc, domainOption) => ({ [domainOption]: domainOption, ...acc }),
        {}
      );
      return true;
    }

    return false;
  }

  setNewDomain(destination) {
    const wasDynamic = destination.domain && destination.domain.dynamic;
    destination.domain = { ...this.newDomain, dynamic: !!wasDynamic };

    // Trigger view reactivity
    //eslint-disable-next-line no-self-assign
    this.dataModel.data = this.dataModel.data;
  }

  copySourceToDomains() {
    for (const d in this.dependant_domains) {
      const dependantKey = this.dependant_domains[d];
      for (const a in this.modelDefinition.definitions) {
        const attr = this.modelDefinition.definitions[a];
        for (const p in attr.parameters) {
          const param = attr.parameters[p];
          if (param.id === dependantKey) {
            this.setNewDomain(param);
          }
          if (param.domain && param.domain.columns) {
            // If param nested in table
            for (const c in param.domain.columns) {
              const column = param.domain.columns[c];
              this.setNewDomain(column);
            }
          }
        }
      }
    }
  }
}

class VariableTableUpdate {
  constructor(hookParams) {
    const { hookConfig, dataModel, modelDefinition } = hookParams;
    const {
      table_variable_id,
      table_attr,
      names_id,
      names_view,
      names_attr,
      match_condition
    } = hookConfig;

    // Find where new names need to go
    const table_view = this.findTargetViewName(dataModel, table_attr);

    Object.assign(this, {
      modelDefinition,
      dataModel,
      names_view,
      names_id,
      names_attr,
      table_view,
      table_attr,
      table_variable_id,
      match_condition
    });
  }

  run() {
    const nameSources = this.readNames();
    const defs = this.modelDefinition.definitions[this.table_attr].parameters;

    // We generate table rows from combining all their names, unless
    // we have a match_condition key
    let restrictions = [];
    if (this.match_condition) {
      restrictions = this.getNameRestrictions(
        this.match_condition,
        this.table_view,
        this.table_attr,
        this.dataModel
      );
    }

    for (const d in defs) {
      const tableDef = defs[d];
      // Only update tables that depend on this dynamic variable
      if (
        tableDef.domain &&
        tableDef.domain.row_kinds &&
        tableDef.domain.row_kinds[this.table_variable_id]
      ) {
        this.writeNamesToDef(tableDef, nameSources);
        if (this.shouldOverwriteTable(tableDef)) {
          this.writeTableToProp(tableDef, nameSources, restrictions);
        }
      }
    }
  }

  writeNamesToDef(tableDef, nameSources) {
    const names = nameSources
      .map(ns => ns.names.value[0] || "")
      .flatMap(p => this.namesFromProp(p))
      .filter(i => i);

    tableDef.domain.row_kinds[this.table_variable_id] = names;
    return names;
  }

  writeTableToProp(tableDef, nameSources, restrictions) {
    const viewData = this.dataModel.data[this.table_view];

    const [attr, ...path] = tableDef.id.split("/");
    let prop_id = attr + "." + attr + "/" + path.join("/");
    // Change id for dynamic views
    if (this.modelDefinition.views[this.table_view].size === -1) {
      prop_id = this.table_view + "." + attr + "/" + path.join("/");
    }

    for (var v = 0; v < viewData.length; v++) {
      viewData[v][this.table_attr][tableDef.id] = {
        value: [this.makeTable(tableDef, nameSources, restrictions)],
        id: prop_id
      };
    }

    // Set object to trigger vue reactivity
    this.dataModel.data[this.table_view] = viewData;
  }

  shouldOverwriteTable(tableDef) {
    // Don't overwrite if we can't find the table
    if (!this.table_view) {
      return false;
    }

    // Overwrite if uninitialized
    const data = this.dataModel.data[this.table_view];
    const attr = data[0][this.table_attr];
    if (!attr[tableDef.id]) {
      // Bridge initialized some data, but not this param
      return true;
    }
    const simputParam = attr[tableDef.id].value[0];
    if (!simputParam) {
      // Table present, but missing data
      return true;
    }

    // Overwrite if names differ at all
    const names = tableDef.domain.row_kinds[this.table_variable_id];
    const nameValues = simputParam.rows.map(
      row => row.rowKeys[this.table_variable_id]
    );

    const uniqNameValues = [...new Set(nameValues)];
    if (uniqNameValues.length !== names.length) {
      return true;
    }

    const oldNames = [...uniqNameValues].sort();
    const newNames = [...names].sort();

    for (let i = 0; i < uniqNameValues.length; i++) {
      if (newNames[i] !== oldNames[i]) {
        return true;
      }
    }

    return false;
  }

  readNames() {
    let nameSources = [];
    const views = this.dataModel.data[this.names_view];

    // Read multiple views if dynamic view
    for (let v = 0; v < views.length; v++) {
      const view = views[v];
      if (view[this.names_attr][this.names_id]) {
        // Parameter is directly on view
        // Find view name if view is dynamic
        const propIsViewName = ([id]) => id.indexOf("/") === -1;
        const viewName = Object.entries(view[this.names_attr]).find(
          propIsViewName
        );
        let parents = [];
        if (viewName) {
          const [id, prop] = viewName;
          if (prop.value[0]) {
            parents = { [id]: prop.value[0] };
          }
        }
        nameSources = nameSources.concat({
          parents,
          names: view[this.names_attr][this.names_id]
        });
      } else {
        // Parameter is nested within a table
        for (const p in view[this.names_attr]) {
          const param = view[this.names_attr][p];
          // If param is a table
          const simputParam = param.value[0];
          if (simputParam && simputParam.rows) {
            for (const r in simputParam.rows) {
              const tableHasNames =
                simputParam.rows[r].rowValues[this.names_id];
              if (tableHasNames)
                nameSources = nameSources.concat({
                  parents: simputParam.rows[r].rowKeys,
                  names: simputParam.rows[r].rowValues[this.names_id].data
                });
            }
          }
        }
      }
    }

    return nameSources;
  }

  // **********************************************
  // ********** Helpers (Pure functions) **********
  // **********************************************
  getNameRestrictions(match_condition, table_view, table_attr, dataModel) {
    // We restrict the rows in a target table based on
    // a value from its sibling table (from same view)
    // which may match a foreign name
    const targetTableKey = this.table_variable_id;
    const { foreignNameKey, siblingParamKey } = match_condition;

    const conditions = [];
    // FIXME have sparsity conditions from dynamic view variables
    const view = dataModel.data[table_view][0];
    for (const p in view[table_attr]) {
      const siblingParam = view[table_attr][p];
      const isTable =
        siblingParam && siblingParam.value[0] && siblingParam.value[0].rows;
      if (isTable) {
        // Read conditions from table
        for (const r in siblingParam.value[0].rows) {
          const siblingRow = siblingParam.value[0].rows[r];
          const siblingValue = siblingRow.rowValues[siblingParamKey];
          if (siblingValue && siblingValue.data.value[0]) {
            const removeMismatch = function(
              { rowKeys: targetTableNames },
              foreignNamesAndParents
            ) {
              // Existing parflow conditions have only 1 rowKey; hardcoding 0
              const [siblingId, siblingName] = Object.entries(
                siblingRow.rowKeys
              )[0];
              const siblingNameMatches =
                targetTableNames[siblingId] === siblingName;
              // Existing parflow conditions have only 1 rowKey; find() gets first (only)
              const valuesMatch = foreignNamesAndParents.find(
                ({ parents }) =>
                  parents[foreignNameKey] === siblingValue.data.value[0]
              );
              if (!valuesMatch || !valuesMatch.names) {
                return false;
              }
              const foreignNameMatches =
                valuesMatch.names.value[0] &&
                valuesMatch.names.value[0].includes(
                  targetTableNames[targetTableKey]
                );
              return siblingNameMatches || !foreignNameMatches;
            };

            conditions.push(removeMismatch);
          }
        }
      }
    }
    return conditions;
  }

  makeTable(tableDef, nameSources, restrictions) {
    const { table_labels, table_order } = tableDef.domain;
    const rows = [];

    const row_permutations = this.rowSectionCombinations(
      tableDef.domain.row_kinds
    );

    for (const r in row_permutations) {
      const permutation = row_permutations[r];

      const valueCells = {};
      for (const c in tableDef.domain.columns) {
        const column = tableDef.domain.columns[c];
        const ui = Object.assign({}, column);

        // Widget selection
        ui.propType = column.ui || column.propType || "cell";
        if (column.type === "enum") {
          ui.propType = "enum";
        }

        valueCells[column.id] = {
          ui,
          data: { value: [] },
          show: () => true
        };
      }
      const newRow = { rowKeys: permutation, rowValues: valueCells };

      if (restrictions.every(r => r(newRow, nameSources))) {
        rows.push(newRow);
      }
    }

    return { rows, tableLabels: table_labels, tableOrder: table_order };
  }

  rowSectionCombinations(sections) {
    const recordList = [];
    for (const key in sections) {
      const row_names = sections[key];
      recordList.push(row_names.map(name => ({ [key]: name })));
    }

    return this.combine(recordList);
  }

  combine([head, ...[tailHead, ...tailTail]]) {
    // Modified from https://stackoverflow.com/a/57015870
    if (!tailHead) return head;

    const combined = tailHead.reduce((acc, x) => {
      return acc.concat(head.map(h => Object.assign({}, x, h)));
    }, []);

    return this.combine([combined, ...tailTail]);
  }

  findTargetViewName(dataModel, attributeName) {
    // Assume only one view has this attribute
    const name = Object.keys(dataModel.data).find(viewKind =>
      dataModel.data[viewKind].find(viewInstance =>
        Object.keys(viewInstance).includes(attributeName)
      )
    );

    return name;
  }

  namesFromProp(prop) {
    if (Number.isInteger(prop)) {
      return [...Array(prop).keys()].map(i => String(i + 1));
    }
    return prop.trim().split(" ");
  }
}
