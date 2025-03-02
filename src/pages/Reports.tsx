import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import moment from 'moment';
import { enGB } from 'date-fns/locale';
import { addDays } from 'date-fns';
import { TripStatus, ServiceType, serviceTypeDisplayMap } from "@/lib/types/trip";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const [tripsData, setTripsData] = useState([]);
  const [dateRange, setDateRange] = useState([
    {
      startDate: addDays(new Date(), -7),
      endDate: new Date(),
      key: 'selection',
    }
  ]);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    fetchTrips();
  }, [dateRange]);

  const fetchTrips = async () => {
    const fromDate = moment(dateRange[0].startDate).format('YYYY-MM-DD');
    const toDate = moment(dateRange[0].endDate).format('YYYY-MM-DD');

    let { data: trips, error } = await supabase
      .from('trips')
      .select('*')
      .gte('date', fromDate)
      .lte('date', toDate);

    if (error) {
      console.error('Error fetching trips:', error);
    } else {
      setTripsData(trips || []);
    }
  };

  useEffect(() => {
    processTripDataForChart();
  }, [tripsData]);

  const processTripDataForChart = () => {
    const tripsByType = tripsData.reduce((acc: { [key: string]: number }, trip: { type: ServiceType }) => {
      const type = trip.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(tripsByType);
    const data = Object.values(tripsByType);

    setChartData({
      labels: labels.map(type => serviceTypeDisplayMap[type as ServiceType] || type),
      datasets: [
        {
          label: 'Number of Trips',
          data: data,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    });
  };

  const handleDateRangeChange = (item: any) => {
    setDateRange([item.selection]);
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Trips by Service Type',
      },
    },
  };

  const serviceTypes = Object.entries(serviceTypeDisplayMap).map(([value, label]) => ({
    value,
    label
  }));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      
      <DateRangePicker
        onChange={handleDateRangeChange}
        showSelectionPreview={true}
        moveRangeOnFirstSelection={false}
        months={2}
        ranges={dateRange}
        direction="horizontal"
        locale={enGB}
      />

      <div className="mt-6">
        {chartData.labels.length > 0 ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <p>No data to display.</p>
        )}
      </div>
    </div>
  );
};

export default Reports;
