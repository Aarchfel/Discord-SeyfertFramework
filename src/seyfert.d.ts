import { CooldownMiddlewares } from '@slipher/cooldown';
import type { Client, ParseClient } from 'seyfert';
import type { Hoshimi } from 'hoshimi';
import { plug } from './plugins';

declare module 'seyfert' {
  interface SeyfertRegistry {
    client: ParseClient<Client<true>>;
    middlewares: CooldownMiddlewares<'cooldown'>;
    plugins: typeof plug;
  }

  interface UsingClient extends Client {}

  interface Client {
    hoshimi: Hoshimi;
  }

  type UsingClient = ParseClient<Client<true>>;
}

declare module 'hoshimi' {
  interface CustomizableTrack {
    requester: {
      id: string;
      username: string;
    };
  }
}

declare module 'better-sqlite3' {
  interface Database {
    prepare<T>(sql: string): T;
  }
}

export {};
