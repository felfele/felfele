import { MutualContact } from './Contact';
import { Feed } from './Feed';

export interface ContactFeed extends Feed {
    contact: MutualContact;
}
