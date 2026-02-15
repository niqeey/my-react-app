const React = require('react');

const BrowserRouter = ({ children }) => React.createElement(React.Fragment, null, children);
const Routes = ({ children }) => React.createElement(React.Fragment, null, children);
const Route = ({ element }) => element || null;
const Link = ({ children }) => React.createElement('a', null, children);
const Navigate = ({ to }) => React.createElement('div', { 'data-testid': 'navigate', 'data-to': to });
const Outlet = () => React.createElement('div', { 'data-testid': 'outlet' });

let navigateMock = jest.fn();
const __setNavigate = (fn) => {
  navigateMock = fn;
};
const useNavigate = () => navigateMock;
const useLocation = () => ({ pathname: '/' });
const useParams = () => ({});

module.exports = {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
  useParams,
  __setNavigate,
};
