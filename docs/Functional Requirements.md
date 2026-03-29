# Elicit and Document Functional Requirements

## 2. Functional Requirements
### 2.1 Ordering 
- FR-01: The system shall allow customers to place orders via tablet or QR code.
- FR-02: The system shall validate order details before confirming the morder.
- FR-03: The system shall categorize orders by type (drink, appetizer, main dish, etc.) and by kitchen station (grill, cold, pastry, etc.).
- FR-04: The system shall transmit confirmed and categorized orders to the Kitchen Display System (KDS) in real time.
### 2.2 Queue Management
- FR-05: The system shall display order queues on the KDS.
- FR-06: The system shall apply smart prioritization to the queue based on dish complexity, kitchen’s capacity, and service time commitments.
- FR-07: The system shall send automated alerts to kitchen staff when an order exceeds its wait-time threshold or a station becomes
overloaded.
- FR-08: The system shall update the order status (Pending, Confirmed, Cooking, Ready, Served, Cancelled) in real time on both the KDS and the customer-facing interface.
### 2.3 Inventory
- FR-09: The system shall track ingredient usage using IoT sensors.
- FR-10: The system shall notify staff when supply runs low
- FR-11: The system shall monitor and log temperature readings from connected cold-storage sensors and raise an alert if a reading falls outside the acceptable range.
### 2.4 Dashboard
- FR-12: The system shall display real-time order status accessible to managers, displaying all active orders and their current statuses.
- FR-13: The system shall display kitchen load indicator on the dashboard, showing the number of active orders per station and an estimated throughput metric.
- FR-14: The system shall generate analytics reports covering order volume, average preparation time, peak hours, and revenue, exportable in at least one standard format (CSV or PDF).
### 2.5 Payment
- FR-15: The system shall track payment status (Unpaid, Pending, Processing, Paid, Refunded, Failed) and display it on the manager dashboard.
- FR-16: The system shall generate table turnover reports showing average dining duration per table and total covers served per shift.





