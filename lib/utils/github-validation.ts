export function validateGitHubUrl(url: string): {
  isValid: boolean;
  error?: string;
  owner?: string;
  repo?: string;
} {
  // Debug logging
  console.log('Validating GitHub URL:', url, 'Type:', typeof url);

  // Check if URL exists and is not empty
  if (!url || url.trim() === '') {
    return {
      isValid: false,
      error: 'Please provide a GitHub repository URL',
    };
  }

  // Check if it's a URL
  try {
    new URL(url.trim());
  } catch (error) {
    console.log('URL validation failed:', error);
    return {
      isValid: false,
      error: 'Please provide a valid URL',
    };
  }

  // Check if it's a GitHub URL
  if (!url.includes('github.com')) {
    return {
      isValid: false,
      error: 'Please provide a GitHub repository URL',
    };
  }

  // Parse owner and repo
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
    /github\.com\/([^\/]+)\/([^\/]+)$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const owner = match[1];
      const repo = match[2].replace(/\.git$/, '');
      
      // Basic validation
      if (owner.length < 1 || repo.length < 1) {
        return {
          isValid: false,
          error: 'Invalid repository owner or name',
        };
      }

      return {
        isValid: true,
        owner,
        repo,
      };
    }
  }

  return {
    isValid: false,
    error: 'Invalid GitHub repository URL format',
  };
}

export function isPublicGitHubRepo(url: string): boolean {
  // This is a basic check - actual verification requires API call
  const validation = validateGitHubUrl(url);
  return validation.isValid;
}