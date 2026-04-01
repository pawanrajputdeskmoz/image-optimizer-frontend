"use client";

import React, { useState } from "react";
import TemplateBox from "./_components/templateBox";

export default function SettingsUI() {
  const [quality, setQuality] = useState<number>(80);
  const [compression, setCompression] = useState<string>("high");
  const [autoOptimize, setAutoOptimize] = useState<boolean>(true);
  const [frequency, setFrequency] = useState<string>("daily");
  const [altTemplate, setAltTemplate] = useState<string[]>(["name"]);
  const [imageFileNameTemplate, setImageFileNameTemplate] = useState<string[]>([
    "name",
  ]);


  return (
    <div className="min-h-screen overflow-y-auto bg-gray-100 p-3 md:p-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
        </div>

        <TemplateBox
          title="Image File Name Template"
          description="Use tokens to generate image file name"
          template={imageFileNameTemplate}
          setTemplate={setImageFileNameTemplate}
        />

        <TemplateBox
          title="Alt Text Template"
          description="Use tokens to generate ALT text"
          template={altTemplate}
          setTemplate={setAltTemplate}
        />




        {/* Tabs */}
        {/* <div className="border-b flex gap-6 text-sm font-medium text-gray-500">
          {["All Images", "Optimized", "Savings", "Reports"].map(
            (tab, i) => (
              <button
                key={i}
                className={`pb-2 border-b-2 ${
                  tab === "Optimized"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div> */}

        {/* Optimization Settings */}
        <div className="bg-white border rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="font-semibold text-gray-700">
            Optimization Settings
          </h2>



          {/* Compression */}
          <div>

            <p className="text-sm font-medium text-gray-600 mb-2">
              Compression Type
            </p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="compression"
                  value="high"
                  checked={compression === "high"}
                  onChange={() => setCompression("high")}
                />
                High
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="compression"
                  value="medium"
                  checked={compression === "medium"}
                  onChange={() => setCompression("medium")}
                />
                Medium
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="compression"
                  value="low"
                  checked={compression === "low"}
                  onChange={() => setCompression("low")}
                />
                Low
              </label>
            </div>
          </div>

          {/* Quality */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Image Quality: {quality}%
            </p>
            <input
              type="range"
              min={0}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Max Dimension */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Max Dimension
            </p>
            <select className="border rounded-lg px-3 py-2">
              <option>1200x1200</option>
              <option>800x800</option>
            </select>
          </div>

          {/* Backup */}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked />
            Create Backup of Original Images
          </label>
        </div>

        {/* Schedule */}
        <div className="bg-white border rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="font-semibold text-gray-700">
            Optimization Schedule
          </h2>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Auto-Optimize New Images
            </span>
            <button
              onClick={() => setAutoOptimize(!autoOptimize)}
              className={`w-12 h-6 flex items-center rounded-full p-1 ${autoOptimize ? "bg-blue-600" : "bg-gray-300"
                }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full transform ${autoOptimize ? "translate-x-6" : ""
                  }`}
              />
            </button>
          </div>

          {/* Frequency */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Frequency
            </p>
            <div className="flex gap-4">
              {["daily", "weekly", "custom"].map((f) => (
                <label key={f} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="frequency"
                    checked={frequency === f}
                    onChange={() => setFrequency(f)}
                  />
                  {f}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 px-4">Product Name</th>
                <th>Images Optimized</th>
                <th>Status</th>
                <th>Compression</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Sports Jacket", "12", "success", "Today, 3:15 PM"],
                ["Handbag Set", "8", "success", "Yesterday, 5:40 PM"],
                ["Camera Lens", "15", "failed", "Apr 18, 2:20 PM"],
              ].map((row, i) => (
                <tr key={i} className="border-b last:border-none">
                  <td className="py-2 px-4">{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${row[2] === "success"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                        }`}
                    >
                      {row[2]}
                    </span>
                  </td>
                  <td>{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


      </div>
    </div>
  );
}
