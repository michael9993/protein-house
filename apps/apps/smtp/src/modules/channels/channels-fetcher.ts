import { Client, gql } from "urql";

import { FetchChannelsDocument } from "../../../generated/graphql";

const _fetchChannelsDoc = gql`
  fragment Channel on Channel {
    name
    id
    slug
  }

  query FetchChannels {
    channels {
      ...Channel
    }
  }
`;

void _fetchChannelsDoc;

export class ChannelsFetcher {
  constructor(private client: Client) {}

  fetchChannels() {
    return this.client
      .query(FetchChannelsDocument, {})
      .toPromise()
      .then((r) => r.data?.channels ?? null);
  }
}
