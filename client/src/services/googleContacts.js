// Google Contacts API Integration
// This service fetches contacts from Google Contacts API

export const fetchGoogleContacts = async (accessToken) => {
  try {
    if (!accessToken) {
      console.log("No access token available for Google Contacts API");
      return [];
    }

    // Make API call to Google People API
    const response = await fetch(
      `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,photos&pageSize=1000`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      // If API call fails, it might be because People API is not enabled
      if (response.status === 403) {
        console.error("People API not enabled or insufficient permissions. Please enable People API in Google Cloud Console.");
        return [];
      }
      throw new Error(`Failed to fetch contacts: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform Google Contacts format to our format
    const contacts = data.connections
      ? data.connections
          .map((contact) => {
            const name = contact.names?.[0]?.displayName || "Unknown";
            const email = contact.emailAddresses?.[0]?.value || null;
            const photo = contact.photos?.[0]?.url || null;

            return { 
              id: contact.resourceName || contact.names?.[0]?.givenName || name,
              name, 
              email, 
              photo 
            };
          })
          .filter((contact) => contact.name && contact.name !== "Unknown") // Filter out invalid contacts
      : [];

    return contacts;
  } catch (error) {
    console.error("Error fetching Google Contacts:", error);
    return [];
  }
};

