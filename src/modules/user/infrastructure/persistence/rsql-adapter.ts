/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { RSQLParser } from 'node-rsql-parser';

export function rsqlToMongo(rsql: string): Record<string, any> {
  const parser = new RSQLParser();
  const ast = parser.parse(rsql);
  return parseNode(ast);
}

function parseNode(node: any): any {
  if (!node) return {};

  console.log('Parsing node:', JSON.stringify(node));

  if (node.type === 'AND' || node.type === 'OR') {
    const operator = node.type === 'AND' ? '$and' : '$or';
    return {
      [operator]: node.args.map(parseNode),
    };
  }

  // Comparación simple
  const field = node.selector;
  const value = parseValue(node.value);

  switch (node.comparison) {
    case '==':
      return { [field]: value };
    case '!=':
      return { [field]: { $ne: value } };
    case '=gt=':
      return { [field]: { $gt: value } };
    case '=lt=':
      return { [field]: { $lt: value } };
    case '=ge=':
      return { [field]: { $gte: value } };
    case '=le=':
      return { [field]: { $lte: value } };
    case '=in=':
      return { [field]: { $in: value } };
    case '=out=':
      return { [field]: { $nin: value } };
    default:
      throw new Error(`Unsupported operator: ${node.comparison}`);
  }
}

function parseValue(value: any): any {
  if (Array.isArray(value)) {
    return value.map(parseValue);
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!isNaN(Number(value))) return Number(value);
  return value;
}
