import { useUser } from "@dashboard/auth";
import { ChannelWarehouses } from "@dashboard/channels/pages/ChannelDetailsPage/types";
import { ChannelCreateInput } from "@dashboard/graphql";

import { useSaveChannel } from "./useSaveChannel";

vi.mock(
  "@dashboard/auth",
  vi.fn(() => ({
    useUser: vi.fn(),
  })),
);
describe("ChannelCreate", () => {
  test("Create channel with user reloading", async () => {
    const config = {
      createChannel: vi.fn(() => ({
        data: {
          channelCreate: {
            channel: {
              warehouses: [],
            },
          },
        },
      })),
      reorderChannelWarehouses: vi.fn(),
    } as unknown as Parameters<typeof useSaveChannel>[number];

    vi.mocked(useUser).mockReturnValue({ refetchUser: vi.fn() });

    const input = {} as ChannelCreateInput;
    const warehousesToDisplay = [] as ChannelWarehouses;
    const save = useSaveChannel(config);

    await save(input, warehousesToDisplay);
    expect(useUser().refetchUser).toHaveBeenCalled();
  });
});
