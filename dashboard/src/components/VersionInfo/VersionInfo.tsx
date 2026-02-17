import { Text } from "@saleor/macaw-ui-next";

interface VersionInfoProps {
  dashboardVersion: string;
  coreVersion: string;
}

const VersionInfo = ({ dashboardVersion, coreVersion }: VersionInfoProps) => {
  if (!dashboardVersion || !coreVersion) {
    return null;
  }

  return (
    <Text size={2} fontWeight="light" className="flex justify-end">
      <div className="text-saleor-main-3 leading-[25.6px] text-[16px] ml-3 tracking-[0.02em] max-lg:text-[14px]">{`dashboard ${dashboardVersion}`}</div>
      <div className="text-saleor-main-3 leading-[25.6px] text-[16px] ml-3 tracking-[0.02em] max-lg:text-[14px]">{`core v${coreVersion}`}</div>
    </Text>
  );
};

VersionInfo.displayName = "VersionInfo";
export default VersionInfo;
