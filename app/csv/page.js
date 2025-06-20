"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { LoaderCircle, CheckCircle2, Upload, X } from "lucide-react";
import { toast } from "sonner";

export default function CompareCSVPage() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");
  const [hideEmpty, setHideEmpty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const highlightDifference = (val1, val2) => {
    if (!val1 || !val2 || val1 === val2) return val2;
    let start = 0;
    while (start < val1.length && val1[start] === val2[start]) start++;
    let end1 = val1.length - 1,
      end2 = val2.length - 1;
    while (end1 > start && end2 > start && val1[end1] === val2[end2]) {
      end1--;
      end2--;
    }
    return (
      <span>
        {val2.slice(0, start)}
        <span className="bg-yellow-200 font-semibold">
          {val2.slice(start, end2 + 1)}
        </span>
        {val2.slice(end2 + 1)}
      </span>
    );
  };

  const formatValue = (val) => {
    try {
      const parsed = JSON.parse(val);
      return (
        <pre className="whitespace-pre-wrap break-words text-wrap">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return val;
    }
  };

  const parseCSV = (file, cb) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => cb(res.data[0] || {}),
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith(".csv"));
    if (files.length === 0) return;

    const file = files[0];
    if (!file1) {
      setFile1(file);
      toast.success(`File 1 uploaded: ${file.name}`);
    } else if (!file2) {
      setFile2(file);
      toast.success(`File 2 uploaded: ${file.name}`);
    } else {
      setFile1(file);
      setFile2(null);
      toast.success(`Replaced File 1 with: ${file.name}`);
    }
  };

  const handleCompare = () => {
    if (!file1 || !file2) return;
    setLoading(true);
    setSuccess(false);
    parseCSV(file1, (row1) => {
      parseCSV(file2, (row2) => {
        const keys = new Set([...Object.keys(row1), ...Object.keys(row2)]);
        const data = Array.from(keys).map((key) => {
          const val1 = row1[key] || "";
          const val2 = row2[key] || "";
          return {
            field: key,
            file1: val1,
            file2: val2,
            status: val1 === val2 ? "PASS" : "FAIL",
          };
        });
        setResults(data);
        setLoading(false);
        setSuccess(true);
      });
    });
  };

  const filtered = results.filter((r) => {
    if (hideEmpty && !r.file1 && !r.file2) return false;
    if (search && !r.field.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const removeFile = (which) => {
    if (which === 1) {
      toast.info(`Removed File 1: ${file1?.name || "Unnamed"}`);
      setFile1(null);
    }
    if (which === 2) {
      toast.info(`Removed File 2: ${file2?.name || "Unnamed"}`);
      setFile2(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 w-full" />

      <main className="flex-1 px-4 py-8 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-foreground">Compare Two CSVs</h1>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="w-full border-2 border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground hover:border-primary/50 transition-all cursor-pointer"
          >
            <Upload className="mx-auto mb-2 h-6 w-6" />
            Drag & drop CSV files here (2 max)
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Input type="file" accept=".csv" onChange={(e) => {
                setFile1(e.target.files[0]);
                toast.success(`File 1 uploaded: ${e.target.files[0].name}`);
              }} />
              {file1 && (
                <Button variant="outline" size="icon" onClick={() => removeFile(1)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input type="file" accept=".csv" onChange={(e) => {
                setFile2(e.target.files[0]);
                toast.success(`File 2 uploaded: ${e.target.files[0].name}`);
              }} />
              {file2 && (
                <Button variant="outline" size="icon" onClick={() => removeFile(2)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button onClick={handleCompare} disabled={!file1 || !file2}>
              Compare
            </Button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-blue-600 animate-pulse">
              <LoaderCircle className="w-4 h-4 animate-spin" /> Comparing files...
            </div>
          )}
          {success && !loading && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-4 h-4" /> Comparison completed.
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-4">
                <Input
                  type="text"
                  placeholder="Search field..."
                  className="w-full sm:w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Checkbox
                  checked={hideEmpty}
                  onCheckedChange={() => setHideEmpty(!hideEmpty)}
                  id="hideEmpty"
                />
                <label htmlFor="hideEmpty" className="text-sm text-muted-foreground">
                  Hide empty fields
                </label>
              </div>

              <div className="overflow-auto border rounded-lg">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Field</TableHead>
                      <TableHead className="w-[300px]">File 1</TableHead>
                      <TableHead className="w-[300px]">File 2</TableHead>
                      <TableHead className="text-center w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          No data to show
                        </TableCell>
                      </TableRow>
                    )}
                    {filtered.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="whitespace-pre-wrap break-words text-xs font-medium">
                          {item.field}
                        </TableCell>
                        <TableCell className="whitespace-pre-wrap break-words text-xs font-mono">
                          {formatValue(item.file1 || "-")}
                        </TableCell>
                        <TableCell className="whitespace-pre-wrap break-words text-xs font-mono">
                          {item.status === "FAIL"
                            ? highlightDifference(item.file1, item.file2)
                            : formatValue(item.file2 || "-")}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${item.status === "PASS"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                              }`}
                          >
                            {item.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="h-16 w-full" />
    </div>
  );
}
