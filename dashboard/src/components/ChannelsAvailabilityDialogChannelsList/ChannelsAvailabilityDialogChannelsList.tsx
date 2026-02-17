import { Channel } from "@dashboard/channels/utils";
import { ControlledCheckbox } from "@dashboard/components/ControlledCheckbox";
import Hr from "@dashboard/components/Hr";
import { Text } from "@saleor/macaw-ui-next";

interface ChannelsAvailabilityContentProps {
  isChannelSelected: (channel: Channel) => boolean;
  channels: Channel[];
  onChange: (option: Channel) => void;
}

const ChannelsAvailabilityContent = ({
  isChannelSelected,
  channels,
  onChange,
}: ChannelsAvailabilityContentProps) => {
  return (
    <>
      {channels.map(option => (
        <div
          key={option.id}
          className="my-2 last:[&_hr]:hidden"
          data-test-id="channel-row"
        >
          <ControlledCheckbox
            checked={isChannelSelected(option)}
            name={option.name}
            label={<Text className="text-sm">{option.name}</Text>}
            onChange={() => onChange(option)}
          />
          <Hr />
        </div>
      ))}
    </>
  );
};

export default ChannelsAvailabilityContent;
