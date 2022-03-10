import { Colors } from "constants/Colors";
import { FontStyleTypes, TextSizes } from "constants/WidgetConstants";
import _, { isBoolean, isObject } from "lodash";
import {
  CellAlignmentTypes,
  CellLayoutProperties,
  ColumnProperties,
  ColumnTypes,
  TableStyles,
  VerticalAlignmentTypes,
} from "../component/Constants";
import { ORIGINAL_INDEX_KEY } from "../constants";

type TableData = Array<Record<string, unknown>>;

/*
 * When the table data changes we need to find the new index of the
 * selectedRow by using the primary key
 */
export const getOriginalRowIndex = (
  prevTableData: TableData,
  tableData: TableData,
  selectedRowIndex: number | undefined,
  primaryColumnId: string,
) => {
  let primaryKey = "";
  let index = -1;

  if (
    !_.isNil(selectedRowIndex) &&
    prevTableData &&
    prevTableData[selectedRowIndex]
  ) {
    primaryKey = prevTableData[selectedRowIndex][primaryColumnId] as string;
  }

  if (!!primaryKey && tableData) {
    const selectedRow = tableData.find(
      (row) => row[primaryColumnId] === primaryKey,
    );

    if (selectedRow) {
      index = selectedRow[ORIGINAL_INDEX_KEY] as number;
    }
  }

  return index;
};

export const getSelectRowIndex = (
  prevTableData: TableData,
  tableData: TableData,
  defaultSelectedRowIndex: string | number | number[] | undefined,
  selectedRowIndex: number | undefined,
  primaryColumnId: string | undefined,
) => {
  let index = _.isNumber(defaultSelectedRowIndex)
    ? defaultSelectedRowIndex
    : -1;

  if (
    selectedRowIndex !== -1 &&
    !_.isNil(selectedRowIndex) &&
    primaryColumnId
  ) {
    index = getOriginalRowIndex(
      prevTableData,
      tableData,
      selectedRowIndex,
      primaryColumnId,
    );
  }

  return index;
};

export const getSelectRowIndices = (
  prevTableData: TableData,
  tableData: TableData,
  defaultSelectedRowIndices: string | number | number[] | undefined,
  selectedRowIndices: number[] | undefined,
  primaryColumnId: string | undefined,
) => {
  let indices: number[];

  if (primaryColumnId && _.isArray(selectedRowIndices)) {
    indices = selectedRowIndices;
  } else if (_.isArray(defaultSelectedRowIndices)) {
    indices = defaultSelectedRowIndices;
  } else {
    indices = [];
  }

  if (primaryColumnId) {
    return indices
      .map((index: number) =>
        getOriginalRowIndex(prevTableData, tableData, index, primaryColumnId),
      )
      .filter((index) => index !== -1);
  } else {
    return indices;
  }
};

//TODO(Balaji): we shouldn't replace special characters
export const removeSpecialChars = (value: string, limit?: number) => {
  const separatorRegex = /\W+/;
  return value
    .split(separatorRegex)
    .join("_")
    .slice(0, limit || 30);
};

/*
 * Function to get list of columns from the tabledata
 */
export const getAllTableColumnKeys = (
  tableData?: Array<Record<string, unknown>>,
) => {
  const columnKeys: Set<string> = new Set();

  if (_.isArray(tableData)) {
    tableData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        columnKeys.add(key);
      });
    });
  }

  return Array.from(columnKeys);
};

export function getTableStyles(props: TableStyles) {
  return {
    textColor: props.textColor,
    textSize: props.textSize,
    fontStyle: props.fontStyle,
    cellBackground: props.cellBackground,
    verticalAlignment: props.verticalAlignment,
    horizontalAlignment: props.horizontalAlignment,
  };
}

export function getDefaultColumnProperties(
  id: string,
  index: number,
  widgetName: string,
  isDerived?: boolean,
): ColumnProperties {
  const columnProps = {
    index: index,
    width: 150,
    originalId: id,
    id: getHash(id),
    alias: id,
    horizontalAlignment: CellAlignmentTypes.LEFT,
    verticalAlignment: VerticalAlignmentTypes.CENTER,
    columnType: ColumnTypes.TEXT,
    textColor: Colors.THUNDER,
    textSize: TextSizes.PARAGRAPH,
    fontStyle: FontStyleTypes.REGULAR,
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDisabled: false,
    isCellEditable: false,
    isCellVisible: true,
    isDerived: !!isDerived,
    label: id,
    computedValue: isDerived
      ? ""
      : `{{${widgetName}.processedTableData.map((currentRow) => ( currentRow[\`${id}\`]))}}`,
  };

  return columnProps;
}

/*
 * Function to extract derived columns from the primary columns
 */
export function getDerivedColumns(
  primaryColumns: Record<string, ColumnProperties>,
): Record<string, ColumnProperties> {
  const derivedColumns: Record<string, ColumnProperties> = {};

  if (primaryColumns) {
    Object.keys(primaryColumns).forEach((columnId) => {
      if (primaryColumns[columnId] && primaryColumns[columnId].isDerived) {
        derivedColumns[columnId] = primaryColumns[columnId];
      }
    });
  }

  return derivedColumns;
}

/*
 * Function that converts unicode string into 53bit hash
 * https://stackoverflow.com/a/52171480/3977641
 */
export function getHash(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `_${4294967296 * (2097151 & h2) + (h1 >>> 0)}`;
}

export const getPropertyValue = (
  value: any,
  index: number,
  preserveCase = false,
) => {
  if (value && isObject(value) && !Array.isArray(value)) {
    return value;
  }
  if (value && Array.isArray(value) && value[index]) {
    return preserveCase
      ? value[index].toString()
      : value[index].toString().toUpperCase();
  } else if (value) {
    return preserveCase ? value.toString() : value.toString().toUpperCase();
  } else {
    return value;
  }
};
export const getBooleanPropertyValue = (value: any, index: number) => {
  if (isBoolean(value)) {
    return value;
  }
  if (Array.isArray(value) && isBoolean(value[index])) {
    return value[index];
  }
  return !!value;
};

export const getCellProperties = (
  columnProperties: ColumnProperties,
  rowIndex: number,
) => {
  if (columnProperties) {
    return {
      horizontalAlignment: getPropertyValue(
        columnProperties.horizontalAlignment,
        rowIndex,
      ),
      verticalAlignment: getPropertyValue(
        columnProperties.verticalAlignment,
        rowIndex,
      ),
      cellBackground: getPropertyValue(
        columnProperties.cellBackground,
        rowIndex,
      ),
      buttonColor: getPropertyValue(columnProperties.buttonColor, rowIndex),
      buttonLabelColor: getPropertyValue(
        columnProperties.buttonLabelColor,
        rowIndex,
      ),
      buttonLabel: getPropertyValue(
        columnProperties.buttonLabel,
        rowIndex,
        true,
      ),
      menuButtonLabel: getPropertyValue(
        columnProperties.menuButtonLabel,
        rowIndex,
        true,
      ),
      iconName: getPropertyValue(columnProperties.iconName, rowIndex, true),
      buttonVariant: getPropertyValue(
        columnProperties.buttonVariant,
        rowIndex,
        true,
      ),
      borderRadius: getPropertyValue(
        columnProperties.borderRadius,
        rowIndex,
        true,
      ),
      boxShadow: getPropertyValue(columnProperties.boxShadow, rowIndex, true),
      boxShadowColor: getPropertyValue(
        columnProperties.boxShadowColor,
        rowIndex,
        true,
      ),
      iconButtonStyle: getPropertyValue(
        columnProperties.iconButtonStyle,
        rowIndex,
        true,
      ),
      textSize: getPropertyValue(columnProperties.textSize, rowIndex),
      textColor: getPropertyValue(columnProperties.textColor, rowIndex),
      fontStyle: getPropertyValue(columnProperties.fontStyle, rowIndex), //Fix this
      isVisible: getBooleanPropertyValue(columnProperties.isVisible, rowIndex),
      isDisabled: getBooleanPropertyValue(
        columnProperties.isDisabled,
        rowIndex,
      ),
      isCellVisible: getBooleanPropertyValue(
        columnProperties.isCellVisible,
        rowIndex,
      ),
      displayText: getPropertyValue(
        columnProperties.displayText,
        rowIndex,
        true,
      ),

      iconAlign: getPropertyValue(columnProperties.iconAlign, rowIndex, true),
      isCompact: getPropertyValue(columnProperties.isCompact, rowIndex),
      menuColor: getPropertyValue(columnProperties.menuColor, rowIndex, true),

      menuItems: getPropertyValue(columnProperties.menuItems, rowIndex),
      menuVariant: getPropertyValue(
        columnProperties.menuVariant,
        rowIndex,
        true,
      ),
      isCellEditable: columnProperties.isCellEditable,
    } as CellLayoutProperties;
  }
  return {} as CellLayoutProperties;
};