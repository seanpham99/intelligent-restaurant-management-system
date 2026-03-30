# Describe System Context and Background
## 1. Problem statement
Restaurants often face operational inefficiencies due to manual processes and lack of coordination between different departments. Customers frequently experience long waiting times when placing orders, especially during peak hours. Additionally, manual order-taking by staff can lead to incorrect or missing orders, which negatively impacts customer satisfaction.
Another major issue is the lack of synchronization between the dining area and the kitchen. Kitchen staff may not receive orders in a timely manner or may struggle to prioritize them effectively. This can result in delays, bottlenecks, and inconsistent service quality.
Furthermore, managers often lack real-time visibility into restaurant operations, such as order status, kitchen workload, and inventory levels. Without accurate and timely data, it becomes difficult to make informed decisions, optimize staffing, or predict busy periods.

## 2. Rationale for IoT Integration
To address these challenges, the Intelligent Restaurant Management System (IRMS) integrates Internet of Things (IoT) technologies into restaurant operations.
IoT-enabled devices such as smart tablets and QR-based menus allow customers to place orders directly without waiting for staff. These orders are instantly transmitted to the system, reducing delays and minimizing human errors.
In the kitchen, IoT-connected Kitchen Display Systems (KDS) provide real-time updates of incoming orders, allowing staff to prioritize tasks efficiently. Additionally, sensors such as load-cell sensors monitor ingredient levels, while temperature sensors ensure proper storage conditions in refrigerators and freezers.
By leveraging IoT, the system enables real-time communication, automation, and data-driven decision-making, ultimately improving efficiency, reducing errors, and enhancing customer experience.

## 3. Stakeholders
### 3.1 Customers
**Description:**  
Experience a streamlined ordering process, minimize delays, and improve service quality.

**Interaction with the system:**
- Use smart menus on IoT-connected tablets or scan QR codes to order food directly without having to wait for a waiter.
- Customer orders are transmitted immediately to the kitchen system.

### 3.2 Kitchen Staff
**Description:**  
Synchronize the order flow with the dining area, ensuring dishes are prepared in the correct order and within expected service times.

**Interaction with the system:**
- View orders on IoT-connected Kitchen Display Systems (KDS).
- Monitor continuously updated order status based on cooking progress and workload.
- Receive alerts for:
  - Dishes requiring special attention  
  - Overloaded kitchen stations
- Use dashboards to track kitchen activity and real-time order progress for better coordination.

### 3.3 Manager
**Description:**  
Make proactive decisions and ensure efficient restaurant operations.

**Interaction with the system:**
- Use real-time dashboards to monitor:
  - Order status  
  - Kitchen workload  
  - Equipment status  
  - System alerts  
- Receive notifications when raw material supplies are low (via load-cell sensors).
- Review analytics reports on:
  - Order flow  
  - Table turnover  
  - Payment status  
- Use predictive insights to:
  - Schedule staff  
  - Optimize menus  
  - Forecast peak hours  


### 3.4 System Admin
**Description:**  
Ensure system stability, performance, and continuous operation.

**Interaction with the system:**
- Maintain software system and IoT devices (tablets, KDS, fridge sensors, weight sensors).
- Ensure continuous data collection and workflow coordination.
- Manage system scalability based on:
  - Order volume  
  - Equipment availability  
- Monitor and resolve system issues to ensure smooth operation.

## 4. System boundary diagram (Context diagram)

![alt text](<Context Diagram-1.png>)
<p align="center"><em>Context Diagram</em></p>
## 5. Use Case Overview
**1. Place orders via IoT device**

Customers place orders using QR menus or smart tablets without waiting for staff.

**2. Validate and process order to kitchen**

The system validates the order and categorizes items (e.g., drinks, appetizers, main dishes) before sending them to the appropriate kitchen stations.

**3. Synchronize Order to Kitchen Display System**

Order is automatically transmitted to KDS for kitchen staff to view and prepare.

**4. Display orders in KDS**

Orders are displayed in real-time on the Kitchen Display System for kitchen staff to prepare.

**5. Monitor Inventory with Load-cell Sensors**

IoT sensors track ingredient levels and notify staff when supplies are low.

**6. Track food temperature**

Monitor temperature to maintain food safety.

**7. Receive Alerts and Notifications**

Staff receive alerts when there are delays, overloads, or issues requiring attention.


**8. View Dashboard and Analytics**

Managers access dashboards to monitor order status, kitchen performance, and business analytics.

**9. Maintain System**

System administrators manage configurations, users, and IoT devices





