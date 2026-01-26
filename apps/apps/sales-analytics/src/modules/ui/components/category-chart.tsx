import { Card, Title, DonutChart, Flex, Text } from "@tremor/react";
import { useMemo, useEffect, useRef } from "react";

import type { CategoryData } from "../../analytics/domain/kpi-types";
import { formatCurrency } from "../../analytics/domain/money";
import { TREMOR_COLORS, getColorValue } from "../utils/color-utils";

interface CategoryChartProps {
  data: CategoryData[];
  currency: string;
  isLoading?: boolean;
}

// Professional color palette optimized for maximum visual distinction
// Colors are ordered by contrast and distinction to ensure categories are easily distinguishable
const COLORS: string[] = [...TREMOR_COLORS];

export function CategoryDonutChart({ data, currency, isLoading }: CategoryChartProps) {
  if (isLoading) {
    return (
      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Title>Sales by Category</Title>
        <div className="flex justify-center items-center h-48">
          <div className="w-32 h-32 bg-gray-100 rounded-full animate-pulse" />
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Title>Sales by Category</Title>
        <Flex justifyContent="center" alignItems="center" className="h-48">
          <Text color="gray">No category data available</Text>
        </Flex>
      </Card>
    );
  }

  // Sort data by value (descending) to ensure consistent ordering for color assignment
  const sortedData = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);
  
  // Get colors for the sorted data - Tremor assigns colors in the order of the data array
  const colorsForChart = useMemo(
    () => COLORS.slice(0, sortedData.length),
    [sortedData.length]
  );
  
  // Create color info for each category in sorted order
  const categoryColors = useMemo(() => {
    return sortedData.map((item, index) => {
      const colorName = colorsForChart[index] || "blue";
      return {
        name: item.name,
        color: getColorValue(colorName, 500),
        hoverColor: getColorValue(colorName, 600),
      };
    });
  }, [sortedData, colorsForChart]);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Apply colors to tooltip indicator squares when tooltip appears
  useEffect(() => {
    const applyTooltipColors = () => {
      // Find the tooltip - check both in container and document
      const tooltip = chartContainerRef.current?.querySelector('.recharts-tooltip-wrapper') ||
                      document.querySelector('.recharts-tooltip-wrapper');
      if (!tooltip) return;

      // Check if tooltip is visible
      const tooltipStyle = window.getComputedStyle(tooltip as Element);
      if (tooltipStyle.display === 'none' || tooltipStyle.visibility === 'hidden' || 
          tooltipStyle.opacity === '0') return;

      // Find the tooltip content
      const tooltipContent = tooltip.querySelector('.recharts-default-tooltip');
      if (!tooltipContent) return;

      // Find tooltip items
      const tooltipItems = tooltipContent.querySelectorAll('.recharts-tooltip-item');
      
      tooltipItems.forEach((tooltipItem) => {
        const tooltipText = tooltipItem.textContent || '';
        
        // Find matching category
        const matchingCategory = categoryColors.find(cat => tooltipText.includes(cat.name));
        
        if (matchingCategory) {
          // Find the indicator - try multiple selectors
          const indicator = tooltipItem.querySelector('div:first-child, span:first-child') ||
                           tooltipItem.firstElementChild;
          
          if (indicator) {
            const el = indicator as HTMLElement;
            const styles = window.getComputedStyle(indicator);
            const width = parseInt(styles.width) || 0;
            const height = parseInt(styles.height) || 0;
            
            // Apply color if it's a small square element (indicator)
            if (width > 0 && width <= 20 && height > 0 && height <= 20) {
              el.style.setProperty('background-color', matchingCategory.color, 'important');
              el.style.setProperty('border-color', matchingCategory.color, 'important');
              // Ensure it's visible
              el.style.setProperty('background', matchingCategory.color, 'important');
            }
          }
        }
      });
    };

    // Use MutationObserver to watch for tooltip changes
    if (chartContainerRef.current) {
      const observer = new MutationObserver(() => {
        requestAnimationFrame(applyTooltipColors);
      });

      // Observe chart container
      observer.observe(chartContainerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      });

      // Also check periodically
      const interval = setInterval(() => {
        requestAnimationFrame(applyTooltipColors);
      }, 100);

      return () => {
        observer.disconnect();
        clearInterval(interval);
      };
    }
  }, [categoryColors]);

  return (
    <Card className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <Title>Sales by Category</Title>
      
      <div ref={chartContainerRef}>
        <DonutChart
          key={`donut-${sortedData.length}-${sortedData.map(d => d.name).join("-")}`}
          className="mt-4 h-48 category-donut-chart"
          data={sortedData}
          category="value"
          index="name"
          valueFormatter={(value) => formatCurrency(value, currency)}
          colors={colorsForChart}
          showAnimation={true}
          variant="donut"
        />
      </div>

      {/* Custom Legend that matches donut chart colors exactly */}
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 category-legend-custom">
        {categoryColors.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="flex items-center gap-2 cursor-pointer group"
            style={{
              color: item.color,
            }}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 transition-colors duration-200"
              style={{
                backgroundColor: item.color,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = item.hoverColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = item.color;
              }}
            />
            <span className="text-sm font-medium">{item.name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
