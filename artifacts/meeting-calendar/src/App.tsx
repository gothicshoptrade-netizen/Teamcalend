import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { Home } from './pages/home';
import { WeekView } from './pages/week';
import { NewMeeting } from './pages/new';
import { MeetingDetail } from './pages/meeting';
import { EmployeesDirectory } from './pages/employees';
import { SearchMeetings } from './pages/search';

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
        <a href="/" className="mt-6 inline-block text-primary hover:underline font-medium">Return Home</a>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/week" component={WeekView} />
      <Route path="/new" component={NewMeeting} />
      <Route path="/meetings/:id" component={MeetingDetail} />
      <Route path="/employees" component={EmployeesDirectory} />
      <Route path="/search" component={SearchMeetings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
