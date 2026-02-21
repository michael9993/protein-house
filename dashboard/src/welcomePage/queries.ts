import { gql } from "@apollo/client";

export const welcomePageActivities = gql`
  query WelcomePageActivities($hasPermissionToManageOrders: Boolean!) {
    activities: homepageEvents(last: 10) @include(if: $hasPermissionToManageOrders) {
      edges {
        node {
          ...Activities
        }
      }
    }
  }
`;

export const welcomePageAnalytics = gql`
  query WelcomePageAnalytics($channel: String!, $hasPermissionToManageOrders: Boolean!) {
    salesToday: ordersTotal(period: TODAY, channel: $channel)
      @include(if: $hasPermissionToManageOrders) {
      gross {
        amount
        currency
      }
    }
    salesThisMonth: ordersTotal(period: THIS_MONTH, channel: $channel)
      @include(if: $hasPermissionToManageOrders) {
      gross {
        amount
        currency
      }
    }
  }
`;

export const welcomePageNotifications = gql`
  query welcomePageNotifications($channel: String!) {
    productsOutOfStock: products(filter: { stockAvailability: OUT_OF_STOCK }, channel: $channel) {
      totalCount
    }
  }
`;

export const dashboardStats = gql`
  query DashboardStats(
    $channel: String!
    $today: Date!
    $hasPermissionToManageOrders: Boolean!
    $hasPermissionToManageUsers: Boolean!
  ) {
    ordersToday: orders(filter: { created: { gte: $today } })
      @include(if: $hasPermissionToManageOrders) {
      totalCount
    }
    ordersToFulfill: orders(
      filter: { status: [UNFULFILLED, PARTIALLY_FULFILLED] }
    ) @include(if: $hasPermissionToManageOrders) {
      totalCount
    }
    productsOutOfStock: products(
      filter: { stockAvailability: OUT_OF_STOCK }
      channel: $channel
    ) {
      totalCount
    }
    productsTotal: products(channel: $channel) {
      totalCount
    }
    customersTotal: customers @include(if: $hasPermissionToManageUsers) {
      totalCount
    }
    customersToday: customers(filter: { dateJoined: { gte: $today } })
      @include(if: $hasPermissionToManageUsers) {
      totalCount
    }
  }
`;

export const dashboardRecentOrders = gql`
  query DashboardRecentOrders($hasPermissionToManageOrders: Boolean!) {
    orders(
      first: 10
      sortBy: { direction: DESC, field: CREATED_AT }
    ) @include(if: $hasPermissionToManageOrders) {
      edges {
        node {
          id
          number
          status
          created
          total {
            gross {
              amount
              currency
            }
          }
          billingAddress {
            firstName
            lastName
          }
          userEmail
        }
      }
    }
  }
`;
