import React, { useEffect, useState, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import reportImage from './assets/city.jpeg';

// Sample fallback data.  If the backend does not respond or returns
// invalid JSON, the UI will use this data so the page continues to
// function during development.  In a production environment the
// endpoint at /api/report-data should return an object with the same
// structure.
const fallbackReport = {
  chart: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Sales (k€)',
        data: [150, 200, 300, 250],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  },
  table: {
    columns: ['Product', 'Units Sold', 'Revenue (€)'],
    rows: [
      ['Widget A', 120, 2400],
      ['Widget B', 80, 1600],
      ['Widget C', 150, 3750],
      ['Widget D', 60, 900]
    ]
  }
};

export default function App() {
  const [report, setReport] = useState(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Fetch data from the backend.  If the request fails we fall back to
  // the local sample data defined above.  This hook runs once when
  // the component mounts.
  useEffect(() => {
    fetch('https://localhost:49842/api/report-data')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setReport(data);
      })
      .catch(() => {
        setReport(fallbackReport);
      });
  }, []);

  // When report data becomes available, create the chart.  Destroy
  // existing charts between renders to avoid memory leaks or duplicate
  // canvases.  This hook depends on the report state.
  useEffect(() => {
    if (report && chartRef.current) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      chartInstanceRef.current = new Chart(ctx, {
        type: 'bar',
        data: report.chart,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Quarter'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Sales (k€)'
              },
              beginAtZero: true
            }
          },
          plugins: {
            legend: {
              position: 'bottom'
            },
            title: {
              display: true,
              text: 'Quarterly Sales Performance'
            }
          }
        }
      });
    }
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [report]);

  // Trigger the download of the PDF report from the backend.  This
  // function is called when the user clicks the button.  It assumes
  // that the backend will respond with a binary PDF at the endpoint
  // /api/report-pdf.
  const handlePdfClick = () => {
    fetch('https://localhost:49842/api/report-pdf')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to generate PDF');
        }
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'report.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error(err);
        alert('Could not generate PDF. Please check the server log.');
      });
  };

  if (!report) {
    return <div>Loading…</div>;
  }

  return (
    <div className="report-container">
      <h1>Executive Summary</h1>
      <p>This proof‑of‑concept demonstrates how an application can combine text, charts, tables and images into a single printable report generated in the browser.  The data shown here is hardcoded but in a real system would come from your .NET backend.</p>
      <div className="two-columns">
        <h2>Market Analysis</h2>
        <p>The following chart visualises quarterly sales performance.  Use this space to describe trends, anomalies and key takeaways.  You could break out different regions or product categories if required.</p>
        <div className="chart-container no-break">
          <canvas ref={chartRef} />
        </div>
        <span class="no-break"></span>
        <h2>Performance Overview</h2>
        <p>Tables are ideal for precise numerical values.  They complement charts by providing the raw figures used to build the visualisations and support narrative commentary.</p>
        <div className="no-break">
          <table>
            <thead>
              <tr>
                {report.table.columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.table.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <td key={`${rowIdx}-${cellIdx}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Conclusion</h2>
        <p>Images can be used to illustrate important concepts, reinforce branding or provide visual interest.  In a production system you might embed a company logo, a product photograph or a schematic diagram.</p>
        <div className="no-break">
          <img src={reportImage} alt="Decorative illustration" />
        </div>
      </div>
      <button onClick={handlePdfClick}>Get PDF Report</button>
    </div>
  );
}