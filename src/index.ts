export default {
    async fetch(request: Request): Promise<Response> {
      // CORS headers to add to all responses
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      };

      // Handle OPTIONS preflight request
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: corsHeaders
        });
      }

      const url = new URL(request.url);

      // Get the target URL from the query string (everything after '?')
      const targetUrl = url.search.slice(1); // Remove the '?' prefix

      // Return usage instructions if no URL provided
      if (!targetUrl) {
        return new Response(
          'CORS Proxy Usage:\n' +
          'https://cors-header-proxy.grimbound.com/?https://target-url.com\n\n' +
          'Example:\n' +
          'https://cors-header-proxy.grimbound.com/?https://api.github.com',
          {
            status: 400,
            headers: {
              'Content-Type': 'text/plain',
              ...corsHeaders
            }
          }
        );
      }

      // Decode the URL (handle both encoded and non-encoded URLs)
      let decodedUrl: string;
      try {
        decodedUrl = decodeURIComponent(targetUrl);
      } catch {
        decodedUrl = targetUrl;
      }

      // Validate that it's a proper URL
      try {
        new URL(decodedUrl);
      } catch {
        return new Response('Invalid target URL: ' + decodedUrl, {
          status: 400,
          headers: {
            'Content-Type': 'text/plain',
            ...corsHeaders
          }
        });
      }

      try {
        // Fetch from the target URL
        const response = await fetch(decodedUrl, {
          method: request.method,
          headers: request.headers,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        });

        // Clone the response and add CORS headers
        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });

        // Add CORS headers to the response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newResponse.headers.set(key, value);
        });

        return newResponse;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return new Response(`Proxy error: ${errorMessage}`, {
          status: 500,
          headers: {
            'Content-Type': 'text/plain',
            ...corsHeaders
          }
        });
      }
    }
  };
