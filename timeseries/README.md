Real Time and Historical System Performance Visualization
===========

Sony Music's digital supply chain manages the delivery of media assets and metadata to the company's distribution partners.
The team managing this process needed a real time and historic view into the performance of these systems with the primary
objective of mitigating system downtime and identifying current and developing delivery activity issues.

- Total package counts and packaging status for distribution partners are visualized with time series bar charts
- The past 60 minutes are shown to the right with rolled up hourly and 2 hour history to the left
- A mouse over on a bar displays the counts for that time stamp
- In addition to package counts darker shaded bars show a 'stale' package count; stale packages have been in a particular status longer than a set threshold

To test performance I added a slider control that allows you to increase the update interval.


[See Live Demo &#187;](http://ernst96.github.io/demo/timeseries/)


![Visualization](/timeseries/timeseries.gif)
