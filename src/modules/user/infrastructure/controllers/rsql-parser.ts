/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable } from '@nestjs/common';
import { parse } from 'node-rsql-parser';

@Injectable()
export class RsqlParser {
  parseToMongoQuery(rsql: string): any {
    if (!rsql || rsql.trim() === '') {
      return {};
    }
    const ast = parse(rsql);
    return this.astToMongo(ast);
  }

  private astToMongo(node: any): any {
    if (node.type === 'AND') {
      return { $and: node.args.map(this.astToMongo.bind(this)) };
    }
    if (node.type === 'OR') {
      return { $or: node.args.map(this.astToMongo.bind(this)) };
    }
    if (node.type === 'COMPARISON') {
      const { selector, comparison, arguments: args } = node;
      const value = args[0];
      switch (comparison) {
        case '==':
          return { [selector]: value };
        case '!=':
          return { [selector]: { $ne: value } };
        case '=gt=':
          return { [selector]: { $gt: value } };
        case '=lt=':
          return { [selector]: { $lt: value } };
        case '=ge=':
          return { [selector]: { $gte: value } };
        case '=le=':
          return { [selector]: { $lte: value } };
        default:
          throw new Error(`Unsupported comparison: ${comparison}`);
      }
    }
    throw new Error('Unknown RSQL node');
  }
}
