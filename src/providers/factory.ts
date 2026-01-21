/**
 * Database Provider Factory
 */

import { IDatabaseProvider } from './interface';
import { PostgreSQLProvider } from './postgresql';
import { MySQLProvider } from './mysql';
import { MSSQLProvider } from './mssql';
import { SQLiteProvider } from './sqlite';
import { ConnectionConfig } from '../types';

export class ProviderFactory {
  static createProvider(type: ConnectionConfig['type']): IDatabaseProvider {
    switch (type) {
      case 'postgresql':
        return new PostgreSQLProvider();
      case 'mysql':
        return new MySQLProvider();
      case 'mssql':
        return new MSSQLProvider();
      case 'sqlite':
        return new SQLiteProvider();
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }
}
