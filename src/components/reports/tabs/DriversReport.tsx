
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileDown, Download } from "lucide-react";
import { format } from "date-fns";
import { useDriversData } from "../hooks/useReportData";
import { exportToPDF, exportToCSV } from "../utils/export-utils";

export const DriversReport = () => {
  const { data: driversData, isLoading: isLoadingDrivers } = useDriversData();

  return (
    <Card className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Drivers Report</CardTitle>
          <CardDescription>Overview of all drivers</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToPDF(driversData || [], 'Drivers Report', 'drivers-report')}
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToCSV(driversData || [], 'drivers-report')}
          >
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>License Type</TableHead>
                <TableHead>License Number</TableHead>
                <TableHead>License Expiry</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingDrivers ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : driversData && driversData.length > 0 ? (
                driversData.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>{driver.name}</TableCell>
                    <TableCell>{driver.contact || 'N/A'}</TableCell>
                    <TableCell>{driver.license_type || 'N/A'}</TableCell>
                    <TableCell>{driver.license_number}</TableCell>
                    <TableCell>
                      {driver.license_expiry 
                        ? format(new Date(driver.license_expiry), 'MMM dd, yyyy')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{driver.status}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
